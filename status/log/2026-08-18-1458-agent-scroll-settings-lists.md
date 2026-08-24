### 2026-08-18 14:58 — Codex — make settings lists scrollable

Changed:
- Made Packages and Team member lists independently scrollable at the same 288px maximum height.
- Kept the Settings modal fixed at 600px.
- Ensured future packages or teammates scroll within their list instead of expanding the modal.

Tried and abandoned (what didn't work, and why):
- Relying only on the modal-level scroll would allow the list content to change the visible layout as it grows.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- Both lists should share the same 288px scroll viewport to preserve their visual match.

Blockers:
- None.
