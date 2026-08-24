### 2026-08-24 11:51 — Codex — add Notes card footer count

Changed:
- Added a Notes card footer showing the number of client/studio notes, matching the existing invoice count footer.
- Added English, Albanian, and German translations for the note count.
- System-generated audit notes are excluded because they are not shown in the Notes preview or chat list.
- Ran `npx tsc --noEmit` from `mobile/`; it passed.
- Ran `npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-notes-count-footer`; it passed.
- Ran `git diff --check` for the mobile change; it passed.

Tried and abandoned (what didn't work, and why):
- None.

Left for next session:
- Nothing specific for this change.

Assumptions made (flag if wrong):
- The Notes footer should read as a localized note count, parallel to “X invoice(s)” in the Invoices footer.

Blockers:
- None.
