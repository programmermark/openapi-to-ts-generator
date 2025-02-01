import { compiler } from '../compiler';
import { parseIR } from '../ir/parser';
import type { IR } from '../ir/types';

export const generateOutput = async ({ context }: { context: IR.Context }) => {
  const result: Record<string, unknown> = {};

  for (const name of context.config.pluginOrder) {
    const plugin = context.config.plugins[name]!;
    plugin._handler({
      context,
      plugin: plugin as never,
    });
  }

  await parseIR({ context });

  if (!context.config.dryRun) {
    const indexFile = context.createFile({
      id: '_index',
      path: 'index',
    });

    for (const file of Object.values(context.files)) {
      const fileName = file.nameWithoutExtension();

      if (fileName === indexFile.nameWithoutExtension()) {
        continue;
      }

      if (!file.isEmpty() && file.exportFromIndex) {
        // TODO: parser - add export method for more granular control over
        // what's exported so we can support named exports
        indexFile.add(
          compiler.exportAllDeclaration({
            module: `./${fileName}`,
          }),
        );
      }

      result[`${fileName}.ts`] = file.toString('\n\n');
    }

    result['index.ts'] = indexFile.toString('\n\n');
  }
  return result;
};
