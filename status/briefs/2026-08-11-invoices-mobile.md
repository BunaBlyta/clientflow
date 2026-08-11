# Brief — Agent C (Mobile): live invoices screens + real Stripe checkout

**Written by Buna's Cowork session, 2026-08-11. You are Agent C. You own
`mobile/**` and `status/CURRENT-mobile.md`. Nothing outside `mobile/`.**

Read `AGENTS.md`, then `docs/HANDOVER-2026-08-11.md`, then
`status/CURRENT-mobile.md`. **Requires Node 22 — run `nvm use 22` before any
expo command.** SDK 57 needs 22.13+.

**You are blocked on Agent A.** `GET /api/invoices` does not exist yet. Check
`status/CURRENT-api.md` for the shape Agent A actually shipped before coding.

---

## Why this task

The mobile app is the entire client-facing experience, and paying an invoice is
the single most important thing a client does in it. Right now that flow is
**fake**: `app/(app)/projects/[id]/invoices/[invoiceId]/checkout.tsx` runs a
`setTimeout(1300)` and flips local state, with a "did it succeed?" boolean.
Meanwhile a real, signature-verified Stripe webhook already writes `PAID` to
the database and has been proven end to end.

Replacing the simulation with the real thing is the highest-value change left
in the project.

## Three screens, in this order

1. `app/(app)/projects/[id]/invoices/index.tsx` — the list
2. `app/(app)/projects/[id]/invoices/[invoiceId]/index.tsx` — the detail
3. `[invoiceId]/checkout.tsx` — the payment

### 1 and 2: wire to the API

Add to `mobile/lib/api.ts`, following the exact shape of the existing
`projectsRequest` / `projectRequest` (they already handle the bearer token, the
`ApiError` class and the base URL):

```ts
export function invoicesRequest(token: string, projectId?: string)
export function invoiceRequest(invoiceId: string, token: string)
export function checkoutRequest(invoiceId: string, token: string)
```

Keep the existing behaviour where **fixture data stays visible if the API is
unreachable** — that is deliberate and already noted in your CURRENT file. It
matters more on mobile than on web, because Buna may be demoing on a phone
where `localhost:3000` is not reachable at all.

### 3: real Stripe checkout — and you do not need an install

`POST /api/stripe/checkout` takes `{ invoiceId }` and returns
`{ checkoutSessionId, checkoutUrl }`. Open `checkoutUrl` in the system browser.

**`expo-linking` (~57.0.5) is already in `mobile/package.json`.**
`Linking.openURL(checkoutUrl)` is enough. `expo-web-browser` is *not*
installed — do not reach for it, and do not run `npx expo install`. This is
worth stating plainly because of a pattern noted in the handover: told "never
install", an agent previously **designed around the rule** instead of asking.
Here you genuinely do not need to; if you conclude otherwise, stop and say so
rather than inventing a workaround.

Replace `beginPayment` / `resolvePayment` in `store/data-store.ts` on this
screen. Payment now happens outside the app, so on return you cannot know the
outcome synchronously — **refetch the invoice and show its real status.**
Handle the honest third case: the user backed out of the browser and the status
is unchanged. Do not optimistically show success.

Keep the existing `select` / `processing` / `success` / `failed` step UI where
it still makes sense. The API also returns 409 for an already-paid invoice and
503 when Stripe is not configured — both need a real message, not a crash.

---

## Two type changes

**`InvoiceKind` needs `"CUSTOM"`.** `mobile/lib/types.ts` line 26 has three
values; Prisma has four. This will fail typecheck at `INVOICE_KIND_LABEL`
(used in `components/InvoiceRow.tsx` and the invoice detail screen) — that is
intended. Give it a label. Agent B is making the identical change in the web
`lib/types.ts`; the two files are parallel copies, so **make yours match theirs
exactly** and do not edit the web file.

**The handover is stale on one point — do not act on it.**
`docs/HANDOVER-2026-08-11.md` §4 says "the mobile type still needs updating"
for nullable `packageId`. It does not: `mobile/lib/types.ts` line 49 already
reads `packageId: string | null`. Line 81 is `ProjectRequest.packageId`, a
different type, and correct as-is. Note the staleness in your log entry so the
next reader does not chase it either.

## Watch for the re-render bug

`store/data-store.ts` has `invoicesForProject` returning `.filter(...)` and a
sorted copy. That is precisely the pattern that caused five infinite-re-render
loops on 10 August: a new array every call, and Zustand compares by reference.
If it is not already wrapped in `useShallow` at the call site, wrap it.

And remember how that bug presents: **the React error pointed at
`_layout.tsx`'s `<Tabs>`, which was innocent.** React blames the nearest
navigator, not the looping component. Do not debug the layout.

---

## Definition of done

- All three screens read live data, with loading, error and empty states.
- Checkout opens the real Stripe URL and the invoice reflects its true status
  afterwards.
- **The app is actually run.** This is the most important line in this brief:
  nobody has ever run this app on a simulator or a device, and it is the single
  largest untested area in the project. Every serious bug this week was found
  by running the app; typecheck, lint and the build were green through all four
  of them.
  - `npx expo start --web` is the low-friction option and needs no Xcode.
  - The iOS Simulator needs full Xcode (~15 GB) and is **not** installed —
    do not try to set it up.
  - Expo Go from the App Store cannot run SDK 57; use `npx eas-cli go` for a
    physical device.
  - On a physical device set `EXPO_PUBLIC_API_URL` to a reachable origin —
    `localhost:3000` will not work from a phone.
  - If Expo reports "internet connection appears offline", that is usually a
    denied Local Network permission, not a code problem.
- `npx tsc --noEmit` from inside `mobile/` passes under Node 22.
- Committed with `git add mobile/ status/` (**never `-A`** — two other agents
  are in this same checkout) and **pushed**.
- `status/CURRENT-mobile.md` overwritten and a new file in `status/log/`, in
  plain language, including what you tried and abandoned.

## Do not

- Do not touch anything outside `mobile/`.
- Do not run `npm install` or `npx expo install`. Print the command and stop.
- Do not create a git worktree. Each one carries its own `node_modules` that
  drifts out of sync — that is exactly what made `expo-router` "vanish" and
  broke this app once already.
- Do not follow `SETUP_GUIDE.md`. It is historical and has a warning banner.
