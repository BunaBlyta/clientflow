# 2026-08-27 13:58 — Claude Code — web note composer, corner resize grip

Follow-up to `2026-08-27-1355-claude-web-note-composer-padding.md`. Buna
clarified the clipped content was "in the corner".

Cause: the shared `<Textarea>` component sets no `resize` rule, so Chrome draws
its default resize handle in the bottom-right corner. On a long note that grip
sits on top of the text.

Fix: `app/(dashboard)/dashboard/projects/[id]/page.tsx` note textarea className
is now `resize-none p-3`. The field already auto-grows via
`field-sizing-content`, so a manual resize handle was pointless anyway.

`npx tsc --noEmit` passes. Committed 011fa7e. Same pre-existing lint errors in
other lanes' files as noted in the previous entry — still not mine to fix.
