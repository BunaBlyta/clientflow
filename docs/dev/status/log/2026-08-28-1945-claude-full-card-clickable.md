# 2026-08-28 — Claude Code — make full cards clickable, not just their inner buttons

PM: "cards that have a clickable button, make the entire card clickable." Audited every card/card-like row component in the mobile app rather than guessing which one they meant:

- `components/InvoiceRow.tsx` — already correct. The whole row is one `Pressable`; the "Pay now"/"View details" pill inside is a plain styled `View`, not a separate touch target, so tapping anywhere on the row (including the pill) already fires the same `onPress`.
- `components/ProjectCard.tsx` — already correct, same pattern: one outer `Pressable`, "View details" at the bottom is just text.
- Invoices tab summary cards, auth result cards (`request-status.tsx`) — informational only, no embedded button, not applicable.
- `app/(app)/home.tsx`'s project status card — **actually broken**. The status pill and "View details" row were each their own small `Pressable`, both navigating to the same place, but the card's title/phase-tracker/dates area between them wasn't tappable at all — a real dead zone on what looks like a single clickable summary card.

Fixed by wrapping the whole `<Card tone="glow">` in one outer `Pressable` (`projectNavigation.openProject`, the same destination both inner pressables already used) and converting the status pill and "View details" row to plain `View`/`Text` — no visual change, whole card is now one hit target.

## Files touched

- `mobile/app/(app)/home.tsx`

## Verification

- `npx tsc --noEmit` from `mobile/` passes.
- Not checked on a device this session.
