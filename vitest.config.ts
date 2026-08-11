import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the "@/lib/..." style imports from tsconfig.json so tests can use
  // the same import paths as the app.
  plugins: [tsconfigPaths()],
  test: {
    // Node, not jsdom. The tests that matter here are pure logic — invoice state
    // transitions, the Stripe webhook handler, request approval. No DOM needed.
    //
    // Note: component tests would need @testing-library/react + jsdom, NOT
    // @vitejs/plugin-react. That plugin pulls in a Babel 8 release candidate,
    // which conflicts with the Babel 7 tree shadcn installed and fails to
    // install at all. Tried on 2026-08-11.
    environment: 'node',

    // Only our own tests. Scoping `include` to the directories we own is the
    // real protection here — a bare '**/*.test.ts' will happily pick up the
    // test files that ship inside dependencies (zod, expo, @adobe/css-tools
    // all ship theirs), try to run them without jest globals, and report a
    // wall of failures that have nothing to do with this project.
    include: ['{app,lib,components,prisma}/**/*.test.ts'],

    // Belt and braces. Note these need '**/' on both sides — a bare
    // 'node_modules' only matches at the top level, which is how a nested
    // node_modules slipped through the first time.
    exclude: [
      '**/node_modules/**',
      '**/mobile/**', // separate project, own toolchain (AGENTS.md §3)
      '**/.next/**',
      '**/lib/generated/**', // Prisma client output
      '**/.claude/**',
    ],
  },
});
