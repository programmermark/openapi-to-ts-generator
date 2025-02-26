# OpenAPI TypeScript Generator

一个强大的工具库，用于将 OpenAPI (Swagger) 规范文件转换为 TypeScript 类型定义。

## 特性

- ✨ 支持多个 OpenAPI 版本
  - OpenAPI 2.x (Swagger)
  - OpenAPI 3.0.x
  - OpenAPI 3.1.x
- 🚀 自动生成完整的 TypeScript 类型定义
- 💪 类型安全，提供完整的类型推导
- 🎯 支持复杂的数据结构和嵌套类型
- 📦 零运行时依赖

## 安装

使用 npm:

```bash
npm install openapi-ts-generator
```

使用 yarn:

```bash
yarn add openapi-ts-generator
```

## 使用方法




### openapi类型说明
```
interface objectType extends Iterable<any> {
  [x: string]: any;
}

interface IOpenAPIObjectBase {
  info: IOpenAPIObjectInfo;
  host: string;
  basePath: string;
  tags: IOpenAPIObjectTag[];
  paths: objectType;
  definitions: objectType;
  [x: string]: any;
}

interface IOpenAPIObjectInfo {
  title: string;
  description: string;
}

interface IOpenAPIObjectTag {
  name: string;
  "x-order": string;
}

interface ISwaggerResource {
  location: string;
  name: string;
  swaggerVersion: string;
  url: string;
}

interface SingleApiTS {
  "index.ts": string;
  // schemas定义
  "schemas.gen.ts": string;
  // 生成的sdk文件（包含类型的请求函数）
  "sdk.gen.ts": string;
  // 生成的类型定义文件
  "types.gen.ts": string;
}

```

### 基础用法

```typescript
import { createClient, defaultPlugins } from "openapi-to-ts-generator";

const result: IOpenAPIObjectBase = {}

// 从 OpenAPI JSON 生成typescript类型
const result: Promise<SingleApiTS[]> = await createClient({
  client: "@hey-api/client-fetch",
  experimentalParser: true,
  input: {
    path: result,
  },
  output: {
    path: "open-api/client",
    format: "prettier",
    lint: "eslint",
  },
  plugins: [
    ...defaultPlugins,
    {
      enums: "typescript",
      name: "@hey-api/typescript",
    },
    {
      name: "@hey-api/schemas",
      type: "json",
    },
  ],
});
```

### 返回结果说明

```

```

## 配置选项

| 选项               | 类型        | 描述                         | 默认值      |
| ------------------ | ----------- | ---------------------------- | ----------- |
| `input`          | `string`  | OpenAPI 规范文件路径         | -           |
| `output`         | `string`  | 输出目录路径                 | `./types` |
| `prettier`       | `boolean` | 是否使用 Prettier 格式化输出 | `true`    |
| `skipValidation` | `boolean` | 是否跳过输入文件验证         | `false`   |

## 示例

### 输入文件 (swagger.json)

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "示例 API",
    "version": "1.0.0"
  },
  "paths": {
    "/users": {
      "get": {
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/User"
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### 生成的类型定义

```typescript
export interface User {
  id: number;
  name: string;
  email: string;
}

export type GetUsersResponse = User[];
```


