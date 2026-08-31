# 2026-08-27 13:55 — Claude Code — web project note composer padding

## Task

Buna: the note textbox on the CRM web side (staff writing a note to a client)
has rounded corners, and a long message gets partly covered by the corner
curve — add padding so the text is fully visible.

(First fixed the same thing on mobile by mistake — see
`2026-08-27-1348-claude-notes-composer-padding.md` — then Buna clarified it was
the web side.)

## Fix

`app/(dashboard)/dashboard/projects/[id]/page.tsx` — the activity-feed note
`<Textarea>` had `className="pl-4 pt-3"`, so it only got extra padding on the
top and left; the right and bottom fell through to the shared component's base
(10px / 8px). A long, wrapped note ran its right edge and last line into the
rounded corners. Changed to `className="p-3"` — a symmetric 12px on all four
sides, well clear of the ~6px corner radius.

## Verification

- `npx tsc --noEmit` from repo root — passes.
- `npm run lint` — the only failures are 2 pre-existing errors in other lanes'
  files (`components/dashboard/settings-content.tsx:33`,
  `components/marketing/mobile-app-section.tsx` img warnings). Confirmed present
  before this change by stashing it and re-running. Not mine to fix — flagging
  for the web lane.

## Scope

One-line className change plus this log. Did not touch `status/CURRENT-web.md`
(Agent B's file).
