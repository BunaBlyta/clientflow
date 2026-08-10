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
    // The Expo app is a separate project with its own toolchain (see AGENTS.md
    // section 3). Linting it with the Next.js web config produces wrong
    // results - it flagged apostrophes inside React Native <Text> and wanted
    // them turned into HTML entities like &apos;, which React Native does not
    // decode, so "obeying" it would print the entity on screen. Mobile gets
    // its own lint setup instead.
    "mobile/**",
    // Each nested agent worktree is a full second checkout of this repo.
    // Linting it means linting every file twice.
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;
