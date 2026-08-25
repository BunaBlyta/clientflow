### 2026-08-25 14:02 — Codex — remove duplicate home layout

Changed:
- Removed the old duplicate paid/outstanding home row so Home now follows the reference sequence: project card, Next payment/Messages cards, then Recent activity.
- Updated the project phase ring to five separated segments matching the PDF composition.
- Added the previously untracked RadialRing component to the commit because project detail now depends on it.

Tried and abandoned (what didn't work, and why):
- Browser preview setup was unavailable in this session, so validation used the Expo web export and source-level comparison against the rendered PDF pages.

Left for next session:
- Existing unrelated dirty mobile files remain unstaged.

Assumptions made (flag if wrong):
- The duplicate Home summary was the most visible remaining source of visual clutter.

Blockers:
- None.
