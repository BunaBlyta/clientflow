# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-25 14:58 by Codex — refine Meridian feedback

## What changed

- Matched the mobile client portal’s shared visual system to `mobile/assets/meridian-design-handoff`: warm off-white canvas, white cards, sage activity rows, exact Meridian teal accents, tighter 390px-style spacing, and restrained 12–24px typography.
- Added a system-safe serif accent for page titles, project names, invoice amounts, and section headings to mirror the handoff’s Lora treatment without installing another package.
- Updated Home to use the five phase-chip summary, compact payment/message stats, and handoff-style activity rows.
- Updated Projects, Invoices, Notifications, Account, and Project Detail headers and layouts; added client avatars to the tab screens.
- Replaced the project detail progress timeline with five phase icon states and resized the segmented ring to the handoff’s 136px treatment.
- Updated invoice and notification rows to use the handoff’s sage capsules with left accent rails.
- Changed default notification icons and rails to quiet grey, reserving soft red/green backgrounds and matching icon colours for danger/success states.
- Centered and slightly reduced the project detail ring, shortened invoice KPI cards, moved invoice/notification rails closer to the card edge, enlarged invoice amounts, and removed the white fill from View actions.
- Reshaped note bubbles so received messages use sage with a soft lower-left corner and sent messages use teal with a soft lower-right corner; sent messages now align to the right without a duplicate avatar.
- Added an Account Settings section for Language, Light/Dark theme, and Help & Support, plus a simple Help & Support screen. Theme selection changes the app palette in place.
- Dropped the project phase row slightly lower beneath the ring and explicitly hid Help & Support from the bottom tab bar; it remains reachable only from Account.
- Restored the five-tab layout spacing by moving Help & Support under a hidden Settings route, removed avatars from Home/Projects/Invoices/Notifications, and increased the visible page titles slightly.
- Gave Help & Support a horizontal icon/title header and separate description spacing.

## Verification

- `npx tsc --noEmit`: passed.
- `npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-meridian-check-v5`: passed.
- `git diff --check`: passed.
- `npx eslint .`: mobile has no applicable ESLint configuration; ESLint reports that all files are ignored.
- Browser preview inspection was unavailable because no browser connection was available in this session.

## Scope and handoff

- No API contracts, stores, navigation behavior, payment behavior, or authentication behavior were changed.
- Existing unrelated auth/navigation work in the checkout was preserved and is not included in the design commit.
- The untracked handoff reference files were used as source material and left untouched.
