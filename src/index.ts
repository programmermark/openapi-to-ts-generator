import { generateOutput } from './generate/output';
import { defaultPlugins, initConfigs } from './getConfig';
import type { IR } from './ir/types';
import { parseOpenApiSpec } from './openApi';
import type { Config, UserConfig } from './types/config';
import { isLegacyClient, legacyNameFromConfig } from './utils/config';

interface WatchValues {
  headers: Headers;
  lastValue: string | undefined;
}

const pCreateClient = async ({
  config,
}: {
  config: Config;
  watch?: WatchValues;
}) => {
  /** openapi json  */
  const data = config.input.path;

  let context: IR.Context | undefined;
  let result: Record<string, unknown> = {};

  if (data) {
    if (
      config.experimentalParser &&
      !isLegacyClient(config) &&
      !legacyNameFromConfig(config)
    ) {
      context = parseOpenApiSpec({ config, spec: data });
    }

    if (context) {
      result = await generateOutput({ context });
    }
  }
  return result;
};

/**
 * Generate the OpenAPI client. This method will read the OpenAPI specification and based on the
 * given language it will generate the client, including the typed models, validation schemas,
 * service layer, etc.
 * @param userConfig {@link UserConfig} passed to the `createClient()` method
 */
export async function createClient(userConfig: UserConfig) {
  let configs: Config[] = [];

  try {
    /** 初始化配置 */
    configs = await initConfigs(userConfig);

    /** 遍历配置，生成代码文件 */
    const clients = await Promise.all(
      configs.map((config) => pCreateClient({ config })),
    );

    return clients;
  } catch (error) {
    console.error(`🔥 Unexpected error occurred. ${error.message}`);
    throw error;
  }
}

export type DefaultPluginType = typeof defaultPlugins;

/**
 * Type helper for openapi-ts.config.ts, returns {@link UserConfig} object
 */
export const defineConfig = (config: UserConfig): UserConfig => config;

export type { IR } from './ir/types';
export type { OpenApi } from './openApi/types';
export type { Plugin } from './plugins/types';
export type { UserConfig } from './types/config';
export type { LegacyIR } from './types/types';
export { utils } from './utils/exports';
export { defaultPlugins };
