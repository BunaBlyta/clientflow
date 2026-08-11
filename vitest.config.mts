import { defineConfig } from 'vitest/config';

// Note the .mts extension: this file uses ESM syntax, and with no
// "type": "module" in package.json a plain .ts config gets loaded as CommonJS,
// which Vite warns about. .mts is the fix that does not require changing the
// module type for the whole project (which would affect Next.js config files).
export default defineConfig({
  resolve: {
    // Resolves "@/lib/..." imports from tsconfig.json. Vite does this natively
    // now — the vite-tsconfig-paths plugin used to be needed and is not any more.
    tsconfigPaths: true,
  },
  test: {
    // Node, not jsdom. The tests that matter here are pure logic — invoice state
    // transitions, the Stripe webhook handler, request approval. No DOM needed.
    //
    // If component tests are ever wanted, use @testing-library/react + jsdom,
    // NOT @vitejs/plugin-react. That plugin pulls in a Babel 8 release candidate
    // which conflicts with the Babel 7 tree shadcn installed, and fails to
    // install at all. Tried on 2026-08-11.
    environment: 'node',

    // Only our own tests. Scoping `include` to the directories we own is the
    // real protection — a bare '**/*.test.ts' picks up the test files that ship
    // inside dependencies (zod, expo and @adobe/css-tools all ship theirs),
    // tries to run them without jest globals, and reports a wall of failures
    // that have nothing to do with this project.
    include: ['{app,lib,components,prisma}/**/*.test.ts'],

    // Belt and braces. These need '**/' on both sides — a bare 'node_modules'
    // only matches at the top level, which is how a nested one slipped through
    // the first time.
    exclude: [
      '**/node_modules/**',
      '**/mobile/**', // separate project, own toolchain (AGENTS.md §3)
      '**/.next/**',
      '**/lib/generated/**', // Prisma client output
      '**/.claude/**',
    ],
  },
});
