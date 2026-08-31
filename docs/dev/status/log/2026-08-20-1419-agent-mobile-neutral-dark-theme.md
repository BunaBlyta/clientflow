# Mobile lane log — 2026-08-20 14:19

## Task

Remove the dark blue treatment from mobile cards and navigation so the mobile
app follows the web CRM’s grayscale shell more closely.

## Changes

- Replaced dark-mode navy/blue-gray background, surface, border, and text
  tokens with neutral charcoal and gray values.
- Kept semantic status colors for paid, overdue, failed, and project-state
  feedback so those states remain easy to scan.
- Updated the navigation and screen canvas to use the neutral surface system.
- Removed remaining hardcoded blue-gray note metadata and changed the Android
  splash background to a neutral gray.

## Verification

- `cd mobile && npx tsc --noEmit` passed.
- `git diff --check -- mobile` passed.
- `cd mobile && npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-neutral-dark` passed.
- In-app browser was unavailable, so no screenshot or device click-through was
  possible.

## Commit

Pending commit at log creation; follow-up commit will contain only the mobile
theme/surface changes and this lane’s state/log files.
