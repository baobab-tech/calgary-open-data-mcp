import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  outDir: "dist",
  noExternal: [/.*/],
  target: "node22",
  splitting: false,
  clean: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
