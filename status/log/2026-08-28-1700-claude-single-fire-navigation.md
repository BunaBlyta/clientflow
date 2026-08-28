# 2026-08-28 — Claude Code — stop rapid taps from stacking duplicate screens

PM/user reported: tapping a button 3 times opened the destination screen 3 times, requiring 3 back-navigations to return. Root cause is generic to `expo-router`/React Navigation: `router.push` always pushes a new screen instance regardless of how fast it's called, and `navigation.navigate` calls made in quick succession (before React re-renders with any state that would have blocked a second call) aren't deduplicated either — there's no built-in guard against a mashed button.

Added `mobile/lib/use-single-fire.ts`: a `useSingleFire(callback, cooldownMs = 800)` hook that wraps a callback in a `useRef`-backed cooldown — a repeat call inside the window is silently ignored. Applied it everywhere in the client app that opens a new screen from a tap:

- `app/(app)/projects/index.tsx` — project row → project detail
- `app/(app)/projects/[id]/index.tsx` — notes/invoices "view all" links + invoice row
- `app/(app)/projects/[id]/invoices/index.tsx` — invoice row → invoice detail
- `app/(app)/projects/[id]/invoices/[invoiceId]/index.tsx` — "Pay now"/"Retry payment" → checkout (highest-value fix here: 3 stacked checkout screens could plausibly mean 3 Stripe sessions, not just a UI annoyance)
- `app/(app)/invoices/index.tsx` — invoice row → invoice detail
- `app/(app)/account/index.tsx` — Edit profile / Change password / Help & Support rows
- `app/(app)/notifications/index.tsx` — the notification row press handler (all three of its destination branches)
- `lib/project-tab-navigation.ts` — the shared `useProjectTabNavigation` hook (Home's project card and next-payment card go through this); guards all three of its methods off one shared ref, since a rapid tap across two different actions from this hook is just as much a mis-tap as two taps on the same one

Deliberately did **not** touch the pre-login auth screens (login's forgot-password/invite-code links, verify-code, forgot-password submit) — lower-traffic, single-shot flows where this is less likely to bite and less costly if it does. Easy to extend the same pattern there if it turns out to matter.

## Files touched

- `mobile/lib/use-single-fire.ts` (new)
- `mobile/lib/project-tab-navigation.ts`
- `mobile/app/(app)/projects/index.tsx`
- `mobile/app/(app)/projects/[id]/index.tsx`
- `mobile/app/(app)/projects/[id]/invoices/index.tsx`
- `mobile/app/(app)/projects/[id]/invoices/[invoiceId]/index.tsx`
- `mobile/app/(app)/invoices/index.tsx`
- `mobile/app/(app)/account/index.tsx`
- `mobile/app/(app)/notifications/index.tsx`

## Verification

- `npx tsc --noEmit` from `mobile/` passes.
- Not run on a device this session — worth an actual multi-tap stress test on a few of these (especially the checkout button) once a device/simulator is available.
