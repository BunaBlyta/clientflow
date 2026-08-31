### 2026-08-18 11:04 — Codex — remove CRM interaction borders

Changed:
- Added a CRM-only wrapper class and CSS rule so button and select borders become transparent while focused, pressed with Space, active, expanded, or selected.
- Kept the keyboard focus ring visible for accessibility and avoided layout shifts by changing only the border color.

Tried and abandoned (what didn't work, and why):
- None.

Left for next session:
- Changes are uncommitted as requested. No checks were run as requested.

Assumptions made (flag if wrong):
- “CRM UI” means the staff dashboard, so marketing controls were intentionally left unchanged.

Blockers:
- None.
