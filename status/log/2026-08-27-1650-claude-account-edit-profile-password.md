# 2026-08-27 16:50 — Claude Code — Account: edit profile + change password (full stack)

Buna authorised Claude Code to build the API endpoints for this as well as
the mobile side (normally API lane / Agent A). Cross-lane work, done in one
pass with Buna present.

## API (`app/api/auth/**`, `docs/ARCHITECTURE.md`)

- **`GET /api/auth/me`** — client responses now also return `companyName` and
  `phone` (either may be `null`).
- **`PATCH /api/auth/me`** (new) — edits the signed-in user's own profile.
  Body: any subset of `{ name?, companyName?, phone? }`. `name` non-empty,
  updates `User.name` and `Client.name` together. `companyName`/`phone` are
  client-only (400 from a staff session); empty string clears to `null`.
  Empty/unrecognised body → 400. Returns the `GET /api/auth/me` shape.
  Email is not editable here by design.
- **`POST /api/auth/change-password`** (new) — `{ currentPassword,
  newPassword }`. Verifies current hash, requires new ≥ 8 chars and
  different from current, rehashes. 400 on any of those failing; success →
  `{ success: true }`. Separate from the code-driven `set-password`.
- **`POST /api/auth/login`** and **`POST /api/auth/set-password`** — client
  responses include `companyName` + `phone` in `user`, so the mobile
  Account card is populated on login without a follow-up `/me` call.
- Tests: `app/api/auth/me/route.test.ts` extended (GET + 5 PATCH cases);
  `app/api/auth/change-password/route.test.ts` new (6 cases). `npx vitest
  run` → 204 pass, 1 pre-existing unrelated failure
  (`verification/verify` expects `{ sent: true }`, route returns
  `{ sent: true, registered: true }` — not touched here). `tsc --noEmit`
  clean repo-wide. `npm run verify` stops at a pre-existing eslint error in
  `components/dashboard/settings-content.tsx` + `date-*` (Web lane, not
  mine, not touched).

## Mobile (`mobile/**`)

- `lib/api.ts` — `updateProfileRequest`, `changePasswordRequest`,
  `ClientProfileResponse` / `ProfileUpdateInput` types. (`AuthUser` /
  `Client` / `clientFromUser` already carried the optional
  `companyName`/`phone`/`memberSince` from the earlier card commit.)
- `store/auth-store.ts` — new `updateClient(partial)` action that merges into
  the in-memory client and re-persists the session (SecureStore).
- `components/ui/TextField.tsx` — added an `editable` prop (disabled style +
  passthrough) for the read-only email field.
- `app/(app)/settings/edit-profile.tsx` (new) — name / company / phone form,
  read-only email with "contact your studio" hint, sends only changed
  fields, merges the response into the session, navigates back.
- `app/(app)/settings/change-password.tsx` (new) — current / new / confirm,
  client-side length + match + "must differ" checks, maps the API's
  "current password incorrect" 400 to a localized message.
- `app/(app)/account.tsx` — new "Profile" preference group above Settings
  with "Edit profile" (SquarePen) and "Change password" (KeyRound) rows.
- `lib/i18n.ts` — ~18 new `account.*` keys in en / sq / de.
- `npx tsc --noEmit` from `mobile/` — clean.

## Not done / notes

- Not run on a device or simulator (none available this session) — the two
  new screens and the profile card need a spot-check.
- `status/CURRENT-api.md` is Agent A's file; I added a short attributed note
  there so the next API session sees these endpoints. If that's the wrong
  call, revert that one hunk — the endpoints and this log are the record.
- Existing logged-in sessions won't show company/phone until their next
  login (stored client object predates the fields); the card and edit form
  both handle their absence.
