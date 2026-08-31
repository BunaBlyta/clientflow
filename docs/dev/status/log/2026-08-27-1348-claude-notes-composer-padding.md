# 2026-08-27 13:48 — Claude Code (mobile lane) — notes composer padding fix

## Task

Buna: "when writing note to a client the textbox is pill shaped, when the message
is long some of the content is covered by the pill shape, make sure there is
padding so its entirely visible"

## What was wrong

The note composer's text field (`mobile/app/(app)/projects/[id]/notes.tsx`, the
`input` style) had a rounded background (14px corner radius) but only 12px of
padding on every side. Because the padding was smaller than the corner radius,
the rounded corners curved inward past where the text sits. With a short message
you don't notice, but once a message is long enough to scroll inside the box, the
first and last visible lines run right into the top and bottom corners and their
edge characters get clipped by the curve.

## Fix

- Bumped the field's inner padding from 12px to 16px on all four sides, so the
  padding is now larger than the 14px corner radius and text can never reach the
  curved corners.
- Nudged the field's minimum height 50 → 52px so a single line still sits
  comfortably with the roomier padding.

Both values stay on the project's 4px spacing grid. No behaviour change beyond
the visual spacing.

## Verification

- `npx tsc --noEmit` from `mobile/` — passes.
- Not checked on a device/simulator this session (none available); it is a pure
  padding change, low risk, but worth a glance next time the app is open.

## Not touched

Everything else. Single-file change plus this log and `status/CURRENT-mobile.md`.
