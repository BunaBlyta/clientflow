### 2026-08-14 09:33 — Agent C — iOS typography, project header, and Account redesign

Changed:
- Use SF Pro Text faces on iOS, with the existing Inter faces retained as the
  fallback for web and non-iOS platforms.
- Removed the duplicate project name from the project-detail content because
  the native stack header already displays it.
- Rebuilt Account into a compact profile/settings layout with grouped contact
  rows, calmer preference controls, and a restrained logout action.

Tried and abandoned (what didn't work, and why):
- No separate Account route or behavior was removed; keeping the route preserves
  existing navigation and settings access while changing its presentation.

Left for next session:
- Reload the Xcode/Metro bundle and review SF Pro rendering and Account spacing
  on the target iPhone.

Assumptions made (flag if wrong):
- “The font” means the loaded Inter face on iPhone, and SF Pro is the desired
  native premium alternative.
- “Title on the bottom” means the duplicate project name in the detail body,
  not the persistent Projects tab label.

Blockers:
- The latest Expo web process did not bind port 8081 in the sandbox; mobile
  TypeScript and all root checks passed.
