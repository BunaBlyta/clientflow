### 2026-08-28 16:29 — Codex — replace browser tab icon

Changed:
- Pointed the web app metadata at the transparent Clientflow logo for the browser tab.
- Removed the old `app/favicon.ico`, which contained the default Next.js triangle.

Tried and abandoned (what didn't work, and why):
- Tried deleting the binary favicon through `apply_patch`; the patch tool could not read its non-UTF-8 contents, so the exact file was removed with a targeted shell command instead.

Left for next session:
- Browsers may need a hard refresh because favicons are cached aggressively.

Assumptions made (flag if wrong):
- The transparent CRM logo is the intended Clientflow mark for the browser tab.

Blockers:
- `npm run verify` remains blocked by pre-existing lint errors in `components/dashboard/date-picker.tsx` and `components/dashboard/settings-content.tsx`.
