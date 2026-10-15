import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Los «._archivo» que macOS deja junto a cada archivo en un disco externo
    // (exFAT): no son código, y ESLint fallaba al intentar leerlos.
    "**/._*",
  ]),
]);

export default eslintConfig;
