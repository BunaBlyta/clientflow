# MyMemory translation endpoint — 2026-08-27 10:44

Replaced Google Cloud behind the existing authenticated `POST /api/translate`
contract with MyMemory's public `GET /get` endpoint. No provider key, billing,
or card setup is required. The server supports `en`, `sq`, and `de`, and an
optional server-only `MYMEMORY_EMAIL` can be sent as MyMemory's `de` parameter
for the higher free daily quota.

The mobile `sourceLanguage: "auto"` contract remains unchanged. Because
MyMemory has no source autodetection mode, the server makes a documented
best-effort choice among English, Albanian, and German; genuinely ambiguous
input returns a clear 422 instead of silently assuming English.

The shared 10,000-character limit is enforced. Content is split at sentence
or word boundaries into chunks no larger than 450 UTF-8 bytes, sent with
`mt=1`, and reassembled without dropping separators or changing the returned
`originalText`. Calls are bounded and failures return safe 502/504 responses;
user text is never logged or stored.

Focused translation tests (12), TypeScript, and ESLint passed. No package or
migration command was run, and no mobile or UI file was changed.
