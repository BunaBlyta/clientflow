# Google Cloud translation endpoint — 2026-08-27 10:22

Replaced the DeepL provider behind the existing authenticated
`POST /api/translate` contract with Google Cloud Translation Basic (v2). The
mobile request and response shape remain unchanged. The server maps `en`, `sq`,
and `de` directly to Google's language codes, sends plain text to the v2 REST
endpoint, and uses only the server-side `GOOGLE_TRANSLATE_API_KEY` header.

The original content is still returned unchanged and is never stored. The
shared 10,000-character validation, i18n-key protection, authentication,
10-second timeout, and safe 503/502/504 error behavior remain in place.

Updated tests to mock Google's endpoint, including a successful Albanian
translation response and request-body/header assertions. Buna must enable the
Cloud Translation API in a Google Cloud project, create a restricted API key,
and add it as `GOOGLE_TRANSLATE_API_KEY` to the server environment. No key was
added or printed, no package was installed, and no migration was run.
