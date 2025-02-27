import { defineConfig } from "tsup";

export default defineConfig(() => ({
  clean: true,
  dts: true,
  entry: ["src/index.ts"],
  format: ["esm"],
  minify: false,
  shims: false,
  sourcemap: true,
  treeshake: true,
}));
