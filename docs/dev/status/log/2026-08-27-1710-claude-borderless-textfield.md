# 2026-08-27 17:10 — Claude Code — borderless TextField, error as label only

Per Buna: no borders on text boxes; a validation error should just be the
label text underneath, not a highlight on the field.

`mobile/components/ui/TextField.tsx`:

- Removed `borderWidth` / `borderColor` from every state. The field is now a
  filled shape only — resting `surfaceMuted`, focused `surface` — matching
  the notes composer's borderless treatment.
- Removed the `inputRowError` style (red border on error) and its usage. The
  `error` prop still renders as `errorText` under the field, which is now the
  sole error affordance.
- Disabled state keeps the same fill; the muted text colour plus the helper
  line carries the "not editable" signal.

Affects every screen using TextField (login, forgot-password, verify-code,
set-password, and the new edit-profile / change-password). `npx tsc
--noEmit` from `mobile/` clean. Not run on a device.
