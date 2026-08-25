# Web lane — lighten dark Most Popular package accents

- Changed only the dark-mode Most Popular package styling on the public landing page.
- The circular Most Popular stamp, price number, radial gradient, and matching shadow now use the light cyan `#CAF4FF` treatment instead of the deeper blue accent.
- Kept the rest of the landing page, package cards, buttons, and light-mode styles unchanged.
- `git diff --check` passed. Full `npm run verify` remains blocked by the existing lint errors in `components/dashboard/date-picker.tsx` and `components/dashboard/settings-content.tsx`.
