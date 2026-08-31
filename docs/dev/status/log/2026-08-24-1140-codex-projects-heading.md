### 2026-08-24 11:40 — Codex — simplify mobile Projects heading

Changed:
- Replaced the personalized “Hi Jordan” greeting and company subtitle on the Projects tab with the translated `Projects` tab title.
- Kept project fetching, empty states, and project navigation unchanged.
- Ran `npx tsc --noEmit` from `mobile/`; it passed.
- Ran `git diff --check` for the mobile change; it passed.

Tried and abandoned (what didn't work, and why):
- None.

Left for next session:
- Nothing specific for this change.

Assumptions made (flag if wrong):
- “Projects only, like in invoices and notifs” means the Projects list should use the existing translated `tabs.projects` label with no client/company subheading.

Blockers:
- None.
