# 2026-08-27 09:27 — Claude Code (mobile) — PM feedback pass

User (Buna) asked to fix a batch of PM review notes on the mobile app. Worked the notes composer's keyboard animation directly, then split the remaining five notes into three parallel background agents (forked from this session, so each inherited full context) scoped to disjoint files to avoid collisions. All four resulting commits are in, tree is clean, `npx tsc --noEmit` passes.

## 1. Notes composer keyboard animation (`9c23e5a`)

User reported the chat composer's background lagged behind the text input when the keyboard opened, then after a first fix that it "floats in the middle of the screen," then after a second fix that the motion didn't feel physically pushed by the keyboard.

- Replaced `KeyboardAvoidingView`'s `padding` behavior (async accessibility check before `LayoutAnimation`, which can start a beat late and doesn't reliably animate a `TextInput`'s native frame) with a single native-driven `Animated.View` transform wrapping the whole composer (background + input + button), keyed to `keyboardWillShow`/`keyboardWillHide`.
- The composer sits inside the bottom tab navigator, which keeps the tab bar mounted underneath this screen — so its resting position is above the tab bar, not flush with the screen edge. Fixed by measuring the composer's actual on-screen frame via `onLayout` and only closing the real gap to the keyboard (`frame.y + frame.height - event.endCoordinates.screenY`), the same computation RN's own `KeyboardAvoidingView` uses internally.
- Easing: iOS reports the keyboard curve as `'keyboard'` or `'easeInEaseOut'`. Originally mapped both to `Easing.inOut(Easing.ease)` (symmetric ease-in-out — near-zero velocity at the start, read as a stall), then to a custom bezier approximating UIKit's private curve 7 (too front-loaded/aggressive — fast snap then a long crawl). Settled on `Easing.out(Easing.cubic)` — full velocity from frame one, smooth deceleration into rest.
- Added `automaticallyAdjustKeyboardInsets` on the chat `ScrollView` so its content inset tracks the keyboard natively, keeping the last message visible above the risen composer.
- Not verified on a physical device this session — user was iterating by feel over several rounds in this same chat, so treat as "much improved, not yet independently re-confirmed on-device."

## 2. Warning/error text color audit (fork, `3902eab`)

PM note: "warning color red." `lib/theme.ts` already had separate `warning` (amber) and `danger` (red) tokens; several screens were using `color.warning` for text that's actually reporting a genuine failure (unreachable fetch, failed post, failed action), not a pending/neutral state.

- Swapped `color.warning` → `color.danger` in the `error`-style text in: `app/(app)/projects/[id]/notes.tsx`, `app/(app)/invoices/index.tsx`, `app/(app)/projects/[id]/invoices/index.tsx`, `app/(app)/projects/[id]/index.tsx`, `app/(app)/notifications/index.tsx` — all confirmed by reading surrounding copy as genuine failure states.
- Left `components/ProjectStageTracker.tsx` alone — its `color.warning` usage is a project-stage tint, not error text, and is correct as-is.
- No genuine pending/warning cases were found among the audited files, so nothing was deliberately left amber.

## 3. Invoice/payment screen radius + spacing (fork, `7f8488a`)

Two PM notes: "radius the same everywhere, particularly in payment details success message and info card" and "spacing between rows... especially payment screen text invoice type amount and status."

- `app/(app)/projects/[id]/invoices/[invoiceId]/index.tsx`: `processingBanner` and `paidBanner` (the "payment processing"/"paid" banners) were `radius.lg` against the info card's (`detailsBlock`) `radius.xl` — unified to `radius.xl`. Kind→amount and amount→status spacing was an inconsistent 8px/16px mix — evened to a consistent `spacing.sm`.
- `app/(app)/projects/[id]/invoices/[invoiceId]/checkout.tsx`: merchant→amount→label spacing had a similar mismatch (amount and label sat flush with zero gap) — evened out. The summary `card`'s radius was already `radius.xl` and consistent, left as-is. `fieldMock`'s `radius.sm` deliberately left alone — it's a small inline element, not a card-level surface.

## 4. Theme crossfade smoothness + account back-button + help-support layout (fork, `41ed31c`)

Three notes bundled together because all three touch `app/(app)/account.tsx`.

- **Theme crossfade** ("she said it's glitchy"): root cause wasn't the fade timing/curve (420ms `Easing.out(Easing.cubic)` was already fine) or the overall screenshot-crossfade architecture in `lib/theme.ts` (left unchanged — the mechanism is sound, see the block comment above `ThemeProvider` for why two earlier simpler approaches were rejected). The actual bug: the small Sun/Moon icon next to "Theme" in the settings row was driven directly by `themeToggleMode`, which flips synchronously on tap — well before the async screenshot capture starts — so it hard-snapped to the new icon in full view for a beat before the crossfade could mask it. The switch thumb already had a fix for this exact problem (a floating `Modal` copy kept in sync, painted over the frozen screenshot); that fix was never extended to the leading icon. Fixed by cross-fading the icon on the same shared `toggleProgress` value the switch's own icons already use.
- **Back button → Home instead of Account**: `app/(app)/settings/help-support.tsx` was pushed from `account.tsx` via `router.push('/settings/help-support')` with no `source` param, and `components/OriginBackButton.tsx`'s `Origin` type didn't recognize `'account'` as a valid origin — so it fell through to `router.back()`, landing on the Tabs navigator's first screen (Home). Fixed: added `'account'` to `Origin`, `account.tsx` now pushes with `source: 'account'`, `help-support.tsx` reads and forwards it to `AppBackButton`.
- **Help & Support header layout**: back button was on its own line above a separate icon+title row. Now back button, icon, and label are one row, matching the pattern already used elsewhere (e.g. the notes screen's sticky header).

## Verification

- `npx tsc --noEmit` from `mobile/`: clean, run after all four commits landed together.
- No `npm run verify` (that's the web/root command) — not applicable here.
- Not verified in a running app/simulator this session — no device/simulator connection was available. User should spot-check on their physical device, particularly the notes composer keyboard animation (iterated by feel over several rounds) and the theme toggle icon fix.

## Scope

- No API contracts, stores, navigation *behavior* beyond the one back-button fix, or payment logic touched.
- Each of the three forked tasks was scoped to an explicit, disjoint file list and instructed to stage only those files by explicit path (never `git add -A`), specifically to avoid collision risk from running three agents concurrently in the same working tree.
