### 2026-08-17 00:34 — mobile agent — selector and navigation refinement

Changed:
- Removed the selected background treatment from the bottom tab bar and made
  the active icon brighter with a stronger stroke.
- Removed the selected background from Account theme and language choices;
  selected rows now use accent text and a checkmark only.

Tried and abandoned:
- No alternate selector control was introduced because it would change the
  interaction model; the existing tap-to-select behavior remains intact.

Left for next session:
- Check the selector row density and active icon contrast on a physical device.

Assumptions made:
- The selected checkmark is a sufficient state cue without adding another
  filled control treatment.

Blockers:
- No connected simulator/browser was available for visual QA.
