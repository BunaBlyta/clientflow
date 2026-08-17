### 2026-08-17 11:44 — Agent A — migrate deprecated Groq model

Changed:
- Traced the deployed AI insight 502 to Groq returning 404 `model_not_found`
  for `llama-3.3-70b-versatile`.
- Replaced it with Groq's recommended production model
  `openai/gpt-oss-120b`, verified the configured account can use it, and updated
  the route regression test.

Tried and abandoned (what didn't work, and why):
- The old model could not be retained: Groq retired it on 16 August 2026 for
  free and developer tiers.
- The full Turbopack build repeated the known sandbox process/port-binding
  panic. The installed webpack builder completed the production build.

Left for next session:
- Rotate the Groq key because a diagnostic command printed its value. Replace
  `GROQ_API_KEY` in Vercel Production and local `.env`, redeploy, and do not
  commit the secret.
- After the model-fix deployment is Ready, generate one insight from the staff
  analytics page and confirm the response is displayed.

Assumptions made (flag if wrong):
- `openai/gpt-oss-120b` is appropriate for the short read-only analytics
  summary; it is Groq's documented replacement and returned the requested plain
  text in a live minimal check.

Blockers:
- None for the code fix. Production key rotation remains a required security
  follow-up for Buna.
