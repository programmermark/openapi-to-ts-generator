import { IRContext } from '../ir/context';
import type { IR } from '../ir/types';
import type { Config } from '../types/config';
import { parseV2_0_X } from './2.0.x';
import { parseV3_0_X } from './3.0.x';
import { parseV3_1_X } from './3.1.x';
import type { OpenApi } from './types';

export type {
  Client,
  Enum,
  Method,
  Model,
  ModelMeta,
  Operation,
  OperationParameter,
  OperationResponse,
} from './common/interfaces/client';
export type { OpenApi } from './common/interfaces/OpenApi';
export { isOperationParameterRequired } from './common/parser/operation';
export {
  ensureValidTypeScriptJavaScriptIdentifier,
  sanitizeNamespaceIdentifier,
  sanitizeOperationParameterName,
} from './common/parser/sanitize';
export { getType } from './common/parser/type';
export type { OpenApiSchema as OpenApiV2Schema } from './v2/interfaces/OpenApiSchema';
export type { OpenApiSchema as OpenApiV3Schema } from './v3/interfaces/OpenApiSchema';

/**
 * Parse the resolved OpenAPI specification. This will populate and return
 * `context` with intermediate representation obtained from the parsed spec.
 */
export const parseOpenApiSpec = ({
  config,
  spec,
}: {
  config: Config;
  spec: unknown;
}): IR.Context | undefined => {
  const context = new IRContext({
    config,
    spec: spec as OpenApi.V2_0_X | OpenApi.V3_0_X | OpenApi.V3_1_X,
  });

  if ('swagger' in context.spec) {
    parseV2_0_X(context as IR.Context<OpenApi.V2_0_X>);
    return context;
  }

  switch (context.spec.openapi) {
    case '3.0.0':
    case '3.0.1':
    case '3.0.2':
    case '3.0.3':
    case '3.0.4':
      parseV3_0_X(context as IR.Context<OpenApi.V3_0_X>);
      return context;
    case '3.1.0':
    case '3.1.1':
      parseV3_1_X(context as IR.Context<OpenApi.V3_1_X>);
      return context;
    default:
      break;
  }

  throw new Error('Unsupported OpenAPI specification');
};
