# 2026-08-28 — Claude Code — Account screen: logout button fill, settings icon color

Two quick follow-up tweaks to `app/(app)/account/index.tsx` from PM feedback.

## Logout button

First pass (previous log entry, `2026-08-28-1955-claude-logout-button-contrast.md`) added a `dangerBorder` outline on top of the existing `dangerBg` fill. PM: "no need for border just change the color and make it darker." Reverted the border, changed the fill itself from `color.dangerBg` (`#FEE2E2`) to `color.dangerBorder` (`#FECACA`) — same token family already used elsewhere for danger badges, just the darker of the two, no new color introduced. Applied to both `logoutButton` (resting state) and `confirmLogoutButton` (the "Log out" side of the Cancel/Log out pair).

## Settings row icons

PM: "dont like the grey icons eihter make them green." The five `SettingsRow` leading icons (Edit profile, Change password, Language, Theme, Help & Support) used `color.textSecondary` (grey); changed to `color.accent` (the brand green). Theme's icon animates between Sun and Moon via a custom `ThemeRowIcon` component with two overlaid icons — updated both. Left the small metadata icons next to the profile details (Mail/Phone/CalendarDays, `color.textMuted`) and the row-disclosure `ChevronRight` arrows as grey — those weren't what was flagged, and quiet/muted is the conventional treatment for that kind of secondary metadata and affordance icon.

## Files touched

- `mobile/app/(app)/account/index.tsx`

## Verification

- `npx tsc --noEmit` from `mobile/` passes.
- Not checked visually on a device this session.
