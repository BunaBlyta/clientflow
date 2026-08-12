# Groq analytics insight — 2026-08-12

- Replaced the Gemini call in `app/api/analytics/insight/route.ts` with Groq’s
  OpenAI-compatible chat completions endpoint using `GROQ_API_KEY` and
  `llama-3.3-70b-versatile`.
- Kept the server-side analytics computation and `projectsByStage` prompt data,
  and updated the route tests for Groq headers, request shape, and response
  parsing.
- Updated the AGENTS.md service references and the analytics API contract to
  describe Groq’s free, no-card, generous-limit setup.
- `npm run verify` passed typecheck, lint, and all 73 tests; its Turbopack build
  hit the sandbox process/port restriction. `npx next build --webpack` passed.
- A signed local login plus `POST /api/analytics/insight` returned HTTP 200 and
  real generated text. No in-app browser instance was available for the literal
  button click-through.
