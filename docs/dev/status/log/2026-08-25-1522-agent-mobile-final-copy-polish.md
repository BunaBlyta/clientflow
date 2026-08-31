### 2026-08-25 15:22 — mobile agent — final Meridian copy polish

Changed:
- Removed the client/company line from the Home project card and aligned the status pill with the project name.
- Changed completed project launch metadata from “Est. launch” to “Launched”.
- Put the Help & Support icon above its title, with the description below.

Verification:
- `npx tsc --noEmit`: passed.
- `npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-meridian-check-v7`: passed before the final title-order-only adjustment.
- `git diff --check`: passed.

Blockers:
- None.
