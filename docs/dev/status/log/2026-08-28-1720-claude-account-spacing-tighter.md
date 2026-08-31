# 2026-08-28 — Claude Code — Account group spacing, one more notch tighter

Follow-up to `2026-08-28-1715-claude-account-spacing-logout.md`: PM said "bit less" after the first pass (16px/12px → 8px/8px). Took `preferenceLabel.marginBottom` and `preferenceGroup.marginBottom` down one more step on the 4px grid, to 4px/4px (`spacing.xs`).

## Files touched

- `mobile/app/(app)/account/index.tsx`

## Verification

- `npx tsc --noEmit` from `mobile/` passes.
