import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // New React Compiler rules introduced by eslint-plugin-react-hooks v6
    // (via eslint-config-next 16). They flag pre-existing patterns
    // (localStorage hydration effects, Date.now() in render) that work today.
    // Kept as warnings until those components are reworked — likely during
    // the paper-redesign overhaul.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Claude Code worktrees/session files — not part of the app
    ".claude/**",
  ]),
]);

export default eslintConfig;
