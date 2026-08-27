# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-27 by Claude Code — invoices tab KPI card alignment + serif figure fix (see below); earlier: notes composer padding fix; composer auto-compact fix + copy message (folding in Codex's concurrent notification/translation work below)

Note: this lane is being worked by both Codex and Claude Code concurrently this week (Buna's call). Each session overwrites this file per the working agreement, so treat it as a merge point, not a single author's log — read `status/log/` for the full narrative if something here looks incomplete.

## Current state

- Working tree clean, `npx tsc --noEmit` passes from `mobile/`.
- Invoices tab: the two KPI cards (Outstanding / Paid to date) now use the same inner padding (both 12; "Paid to date" was falling through to the Card default of 20). Also pinned both labels to a single line (`numberOfLines={1}`) — "PAID TO DATE" wrapped to two lines in the narrow card while "OUTSTANDING" stayed on one, pushing the amount below it out of alignment with the other card. Finally, the currency amounts render in Georgia (`fontFamily.serif`), whose default oldstyle figures make digits like 4/5/7/9 dip below the baseline — added `fontVariant: ['lining-nums', 'tabular-nums']` to the KPI value and to `InvoiceRow`'s amount so figures sit on one baseline and align by column.
- Notes composer text field: inner padding raised to 16px on all sides (was 12px, smaller than the 14px corner radius, so long scrolled messages had their top/bottom lines clipped by the rounded corners); min height 52px. See `status/log/2026-08-27-1348-claude-notes-composer-padding.md`.
- Notes composer: native height auto-sizes to content (compact ↔ capped/scrollable for long drafts), localized character count/error at the API's 10,000-char limit, keeps the full draft on a failed send. After a successful send it resets to compact height and now stays that way — fixed a race where a stray native `onContentSizeChange` for the pre-clear content could fire after the reset and re-expand the box until the user tapped back in; content-size reports are now suppressed after a send until the user actually types again.
- Chat message bubbles support long-press-to-copy (copies the currently displayed/translated text to the clipboard, using react-native's still-functional in-core `Clipboard` — no new package needed), with a brief "Copied" swap in place of the timestamp as confirmation. Disabled on preview bubbles (e.g. Home's recent-activity card).
- Notifications: paginated (20/page, loads more near list end), Active/Archived views (archive/restore via `{ archived: boolean }` on the authenticated endpoint, preserving local read state), realtime/push merges by notification ID without duplicates, timestamps shown inline after the title.
- Human-authored note bodies and new-note notification bodies translate asynchronously through the authenticated `/api/translate` route (deduped/cached in memory; falls back to original content on any provider/route/token error). System note text and templated notification copy stay on the deterministic i18n path.
- Earlier this session (2026-08-27 morning): fixed five PM review notes — see `status/log/2026-08-27-0927-claude-pm-notes-fixes.md` for full detail (composer keyboard-follow animation, warning/error text colors across 5 screens, invoice/checkout radius+spacing consistency, theme-toggle icon flash, Help & Support back-button-to-Home bug) — plus a follow-up pass on the Help & Support page layout and content (icon sizing/row layout per feedback, then fleshed out from two thin paragraphs into four real sections).
- The theme toggle (dark/light crossfade) has a long history of iteration in this project's log — see older log entries for that saga. As of today it's a real screenshot-crossfade (`lib/theme.ts`'s `ThemeProvider`) plus a synced floating-Modal copy of the Account screen's switch and its leading icon so neither desyncs from the frozen screenshot. Considered stable.

## API dependencies / next actions

- The API lane has prepared notification archive persistence, but its Prisma migration is not applied to Neon. Buna must run `npx prisma migrate deploy` once from the repository root after reviewing it; do not run it concurrently with another migration.
- `/api/translate` (server-side DEEPL_API_KEY) must be committed/deployed as an authenticated route — the mobile client already sends `{ text, targetLanguage, sourceLanguage: 'auto' }` and safely falls back to original content when the route is unavailable.
- The paginated notification envelope has no global unread total yet. Loaded/realtime unread state is kept consistent, but an exact badge across unloaded pages needs an API-provided unread count.

## Login reachability finding

- Login is correctly formed as `POST /api/auth/login`; the shown error is only used when `fetch` gets no HTTP response (`ApiError.status === 0`).
- Mobile `.env`'s `EXPO_PUBLIC_API_URL` (`https://clientflow-ijdn.vercel.app`) timed out from this machine while `vercel.com` itself responded. Buna needs to confirm the current production URL, update `.env`, and rebuild/restart Expo so the value is embedded.

## Not verified on-device

- Nothing in this file has been confirmed on a physical device or simulator this session (none was available) — flagging in particular the composer's keyboard-follow animation and the new auto-compact/copy-message fix for a spot-check.
