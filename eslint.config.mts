import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
  globalIgnores([
    "node_modules",
    "coverage",
    "dist",
    "tests",
    "main.js",
    "esbuild.config.mjs",
    "vitest.config.ts",
    "versions.json",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
  ]),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "eslint.config.mts",
            "manifest.json",
            "scripts/*.mjs",
          ],
        },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".json"],
      },
    },
  },
  ...obsidianmd.configs.recommended,
  {
    files: ["scripts/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // These scripts run under Node.js during development and release only.
      "obsidianmd/no-nodejs-modules": "off",
      "obsidianmd/rule-custom-message": "off",
    },
  },
  {
    files: ["src/main.ts"],
    rules: {
      // The manifest supports Obsidian 1.5; declarative settings require 1.13.
      "obsidianmd/settings-tab/prefer-setting-definitions": "off",
    },
  },
);
