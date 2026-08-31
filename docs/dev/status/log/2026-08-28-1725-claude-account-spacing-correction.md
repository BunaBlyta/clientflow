# 2026-08-28 — Claude Code — Account group spacing: correcting an overshoot

Follow-up to `2026-08-28-1715-...` and `2026-08-28-1720-...`. PM's "bit less" after the first pass (16px/12px → 8px/8px) meant "less tightening" — i.e. back off toward the original — but it read as "less spacing" and got tightened further to 4px/4px, the opposite direction. Corrected: settled on 12px/8px (`preferenceLabel.marginBottom` / `preferenceGroup.marginBottom`), a lighter touch than both previous passes.

## Files touched

- `mobile/app/(app)/account/index.tsx`

## Verification

- `npx tsc --noEmit` from `mobile/` passes.
