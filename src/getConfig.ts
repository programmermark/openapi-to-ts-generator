import type { ClientPlugins, UserPlugins } from "./plugins";
import { defaultPluginConfigs } from "./plugins";
import type {
  AnyPluginName,
  DefaultPluginConfigs,
  PluginContext,
  PluginNames,
} from "./plugins/types";
import type { ClientConfig, Config, UserConfig } from "./types/config";
import { CLIENTS } from "./types/config";
import { isLegacyClient, setConfig } from "./utils/config";

const getClient = (userConfig: ClientConfig): Config["client"] => {
  let client: Config["client"] = {
    bundle: false,
    name: "" as Config["client"]["name"],
  };
  if (typeof userConfig.client === "string") {
    client.name = userConfig.client;
  } else if (userConfig.client) {
    client = {
      ...client,
      ...userConfig.client,
    };
  }
  return client;
};

const getInput = (userConfig: ClientConfig): Config["input"] => {
  let input: Config["input"] = {
    path: "",
  };
  if (typeof userConfig.input === "string") {
    input.path = userConfig.input;
  } else if (userConfig.input && userConfig.input.path) {
    input = {
      ...input,
      ...userConfig.input,
    };
  } else {
    input = {
      ...input,
      path: userConfig.input,
    };
  }
  return input;
};

const getLogs = (userConfig: ClientConfig): Config["logs"] => {
  let logs: Config["logs"] = {
    level: "info",
    path: "",
  };
  if (typeof userConfig.logs === "string") {
    logs.path = userConfig.logs;
  } else {
    logs = {
      ...logs,
      ...userConfig.logs,
    };
  }
  return logs;
};

const getOutput = (userConfig: ClientConfig): Config["output"] => {
  let output: Config["output"] = {
    clean: true,
    format: false,
    lint: false,
    path: "",
  };
  if (typeof userConfig.output === "string") {
    output.path = userConfig.output;
  } else {
    output = {
      ...output,
      ...userConfig.output,
    };
  }
  return output;
};

const getPluginsConfig = ({
  pluginConfigs,
  userPlugins,
  userPluginsConfig,
}: {
  pluginConfigs: DefaultPluginConfigs<ClientPlugins>;
  userPlugins: ReadonlyArray<AnyPluginName>;
  userPluginsConfig: Config["plugins"];
}): Pick<Config, "plugins" | "pluginOrder"> => {
  const circularReferenceTracker = new Set<AnyPluginName>();
  const pluginOrder = new Set<AnyPluginName>();
  const plugins: Config["plugins"] = {};

  const dfs = (name: AnyPluginName) => {
    if (circularReferenceTracker.has(name)) {
      throw new Error(`Circular reference detected at '${name}'`);
    }

    if (!pluginOrder.has(name)) {
      circularReferenceTracker.add(name);

      const pluginConfig = pluginConfigs[name as PluginNames];
      if (!pluginConfig) {
        throw new Error(
          `🚫 unknown plugin dependency "${name}" - do you need to register a custom plugin with this name?`
        );
      }

      const defaultOptions = defaultPluginConfigs[name as PluginNames];
      const userOptions = userPluginsConfig[name as PluginNames];
      if (userOptions && defaultOptions) {
        const nativePluginOption = Object.keys(userOptions).find((key) =>
          key.startsWith("_")
        );
        if (nativePluginOption) {
          throw new Error(
            `🚫 cannot register plugin "${name}" - attempting to override a native plugin option "${nativePluginOption}"`
          );
        }
      }

      const config = {
        _dependencies: [],
        ...defaultOptions,
        ...userOptions,
      };

      if (config._infer) {
        const context: PluginContext = {
          ensureDependency: (dependency) => {
            if (
              typeof dependency === "string" &&
              !config._dependencies.includes(dependency)
            ) {
              config._dependencies = [...config._dependencies, dependency];
            }
          },
          pluginByTag: (tag) => {
            for (const userPlugin of userPlugins) {
              const defaultConfig =
                defaultPluginConfigs[userPlugin as PluginNames];
              if (
                defaultConfig &&
                defaultConfig._tags?.includes(tag) &&
                userPlugin !== name
              ) {
                return userPlugin;
              }
            }
          },
        };
        config._infer(config, context);
      }

      for (const dependency of config._dependencies) {
        dfs(dependency);
      }

      circularReferenceTracker.delete(name);
      pluginOrder.add(name);

      // @ts-expect-error
      plugins[name] = config;
    }
  };

  for (const name of userPlugins) {
    dfs(name);
  }

  return {
    pluginOrder: Array.from(pluginOrder) as ReadonlyArray<PluginNames>,
    plugins,
  };
};

const getPlugins = (
  userConfig: ClientConfig
): Pick<Config, "plugins" | "pluginOrder"> => {
  const userPluginsConfig: Config["plugins"] = {};

  const userPlugins = (userConfig.plugins ?? defaultPlugins)
    .map((plugin) => {
      if (typeof plugin === "string") {
        return plugin;
      }

      if (plugin.name) {
        // @ts-expect-error
        userPluginsConfig[plugin.name] = plugin;
      }

      return plugin.name;
    })
    .filter(Boolean);

  return getPluginsConfig({
    pluginConfigs: {
      ...userPluginsConfig,
      ...defaultPluginConfigs,
    },
    userPlugins,
    userPluginsConfig,
  });
};

const getWatch = (
  userConfig: Pick<ClientConfig, "watch"> & Pick<Config, "input">
): Config["watch"] => {
  let watch: Config["watch"] = {
    enabled: false,
    interval: 1000,
  };
  // we cannot watch spec passed as an object
  if (typeof userConfig.input.path !== "string") {
    return watch;
  }
  if (typeof userConfig.watch === "boolean") {
    watch.enabled = userConfig.watch;
  } else if (typeof userConfig.watch === "number") {
    watch = {
      enabled: true,
      interval: userConfig.watch,
    };
  } else if (userConfig.watch) {
    watch = {
      ...watch,
      ...userConfig.watch,
    };
  }
  return watch;
};

/**
 * Default plugins used to generate artifacts if plugins aren't specified.
 */
export const defaultPlugins = [
  "@hey-api/typescript",
  "@hey-api/sdk",
] as const satisfies ReadonlyArray<UserPlugins["name"]>;

export const initConfigs = async (
  userConfig: UserConfig
): Promise<Config[]> => {
  const userConfigs: ClientConfig[] = [userConfig];

  return userConfigs.map((userConfig) => {
    const {
      base,
      configFile = "",
      dryRun = false,
      experimentalParser = true,
      exportCore = true,
      name,
      request,
      useOptions = true,
    } = userConfig;

    const logs = getLogs(userConfig);

    if (logs.level === "debug") {
      console.warn("userConfig:", userConfig);
    }

    const input = getInput(userConfig);
    const output = getOutput(userConfig);

    if (!input.path) {
      throw new Error(
        "🚫 missing input - which OpenAPI specification should we use to generate your client?"
      );
    }

    if (!output.path) {
      throw new Error(
        "🚫 missing output - where should we generate your client?"
      );
    }

    const client = getClient(userConfig);

    if (client.name && !CLIENTS.includes(client.name)) {
      throw new Error("🚫 invalid client - select a valid client value");
    }

    if (!useOptions) {
      console.warn(
        "❗️ Deprecation warning: useOptions set to false. This setting will be removed in future versions. Please migrate useOptions to true https://heyapi.dev/openapi-ts/migrating.html#v0-27-38"
      );
    }

    const config = setConfig({
      ...getPlugins(userConfig),
      base,
      client,
      configFile,
      dryRun,
      experimentalParser,
      exportCore: isLegacyClient(client) ? exportCore : false,
      input,
      logs,
      name,
      output,
      request,
      useOptions,
      watch: getWatch({ ...userConfig, input }),
    });

    if (logs.level === "debug") {
      console.warn("config:", config);
    }

    return config;
  });
};
