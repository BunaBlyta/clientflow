### 2026-08-25 15:14 — mobile agent — navigation and title polish

Changed:
- Restored the five visible bottom tabs by moving Help & Support to a nested, hidden Settings route.
- Removed avatars from Home, Projects, Invoices, and Notifications; Account keeps its profile avatar.
- Increased page-title sizing and added more separation between the Help & Support icon/title and its description.

Verification:
- `npx tsc --noEmit`: passed.
- `npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-meridian-check-v5`: passed.
- `git diff --check`: passed.

Blockers:
- None.
