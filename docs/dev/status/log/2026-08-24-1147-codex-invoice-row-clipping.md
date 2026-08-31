### 2026-08-24 11:47 — Codex — prevent mobile invoice row clipping

Changed:
- Removed the invoice row wrapper’s unnecessary `overflow: hidden` constraint.
- Added full-width and minimum-width layout rules so the invoice row stays inside the screen while the text column gives space to the amount, status, and chevron.
- Ran `npx tsc --noEmit` from `mobile/`; it passed.
- Ran `npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-invoice-row-fix`; it passed.
- Ran `git diff --check` for the mobile change; it passed.

Tried and abandoned (what didn't work, and why):
- The in-app browser was unavailable, so visual click-through was not possible here.

Left for next session:
- Nothing specific for this change.

Assumptions made (flag if wrong):
- “Invoice card doesn’t render all the way” refers to the shared invoice row being clipped or pushed beyond the narrow mobile viewport.

Blockers:
- None.
