import type { ImportExportItemObject } from '../compiler/utils';
import type { Config } from '../types/config';
import { relativeModulePath } from './utils';

/**
 * Returns path to the client module. When using client packages, this will be
 * simply the name of the package. When bundling a client, this will be a
 * relative path to the bundled client folder.
 */
export const clientModulePath = ({
  config,
  sourceOutput,
}: {
  config: Config;
  sourceOutput: string;
}): string => {
  if (config.client.bundle) {
    return relativeModulePath({
      moduleOutput: 'client',
      sourceOutput,
    });
  }

  return config.client.name;
};

export const clientApi = {
  Options: {
    asType: true,
    name: 'Options',
  },
  OptionsLegacyParser: {
    asType: true,
    name: 'OptionsLegacyParser',
  },
} satisfies Record<string, ImportExportItemObject>;
