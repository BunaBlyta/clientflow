# Rejection email — 2026-08-12

Project-request rejection now sends the prospect a plain-language email using
the same Resend service, sender address, and failure handling as the existing
verification email. This happens for every successful rejection, including a
first-time prospect whose request has no client account yet.

If a request somehow already has a linked client, the existing in-app
rejection notification is still created as before. The route reports whether
the email was sent without undoing the rejection if email delivery fails.

Typecheck, lint, and all tests passed. The normal build was blocked by the
local sandbox's known Turbopack port restriction; the Webpack build completed
successfully.
