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
  ]),
  {
    rules: {
      // Allow `any` type in catch blocks and Supabase error handling
      "@typescript-eslint/no-explicit-any": "off",
      // Allow calling setState inside effects for data-fetching patterns
      "react-hooks/set-state-in-effect": "off",
      // Allow Math.random / Date.now in event handlers and effects
      "react-hooks/purity": "off",
    },
  },
]);

export default eslintConfig;
