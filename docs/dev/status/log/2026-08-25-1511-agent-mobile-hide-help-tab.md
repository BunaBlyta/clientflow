### 2026-08-25 15:11 — mobile agent — hide Help & Support tab fix

Changed:
- Removed the incompatible `href` option from the hidden Help & Support tab registration. It now uses only `tabBarButton: () => null`, so the screen remains reachable from Account without rendering a bottom-tab item.

Verification:
- `npx tsc --noEmit`: passed.
- `npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-meridian-check-v4`: passed.
- `git diff --check`: passed.

Blockers:
- None for this fix.
