# DeepL translation endpoint — 2026-08-27 10:16

Added the authenticated `POST /api/translate` route for note and message text.
It validates non-empty input against the shared 10,000-character limit, accepts
English, Albanian, and German targets plus an optional concrete or auto-detected
source language, and rejects the app's translation-key-shaped content.

The server sends the original text to DeepL using the server-only
`DEEPL_API_KEY`; the response returns the original unchanged alongside the
translation and no content is stored. DeepL Free and Pro endpoints are selected
from the key's documented `:fx` suffix. Missing configuration, provider errors,
and the 10-second timeout return explicit 503, 502, and 504 responses. The
required `sq` value is mapped to `SQ`; if the current DeepL text API rejects
Albanian for the account, that rejection is surfaced as 502 without a silent
fallback language.

Added Vitest coverage for authentication, validation, the exact limit boundary,
missing configuration, provider success/failure, language-code mapping,
auto-detection, and timeout handling. Buna needs to add `DEEPL_API_KEY` to the
server environment; no key was added or printed.
