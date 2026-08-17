### 2026-08-17 16:56 — Codex — landing page follow-up

Changed:
- Restored the second, visible custom inquiry form in the Contact section with required-field asterisks, top-of-form error warnings, and bounded textarea resizing.
- Kept the custom inquiry modal triggers in the hero and custom package card.
- Restored the original “How it works” hover animations and connector animation while keeping button interactions spatially stable.
- Reduced package card minimum height from 360px to 320px.
- Clamped package descriptions to two visual rows and kept the shared minimum height so package card rows stay aligned.
- Avoided duplicate label IDs between the inline contact form and the modal form.

Tried and abandoned (what didn't work, and why):
- None.

Left for next session:
- A human browser pass should confirm the shorter card height still has comfortable breathing room at the target viewport widths.

Assumptions made (flag if wrong):
- “Second contact form” means the previously removed inline custom inquiry form in the Contact section, while the modal remains the package-card interaction.

Blockers:
- None. Typecheck, lint, tests, and the webpack production build passed. The two existing raw `<img>` lint warnings remain in the mobile-app marketing section.
