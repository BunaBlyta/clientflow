# 2026-08-27 16:40 — Claude Code — Account profile card fill-out + edit-info/password scoping

## Context

Buna (relaying a PM note): the Account tab's profile card "looks a bit
empty", and the PM wants clients to be able to edit their own info and
password.

## What was actually wrong with the card

The mobile app only receives `name` + `email` from the auth payload
(`/api/auth/login`, `/api/auth/set-password` → `AuthUser`). The card's third
line showed `client.companyName`, but `clientFromUser()` in `lib/api.ts` was
setting `companyName = user.name` — so the card printed the person's name
twice and had nothing else in it.

The database *does* have `Client.companyName` and `Client.phone` (both
nullable) and staff-side `GET /api/clients/[id]` returns them — they were
just never sent to mobile.

## Mobile changes made this session (committed)

- `lib/types.ts` — `Client.companyName` and `.phone` are now optional; added
  optional `memberSince` (ISO string).
- `lib/api.ts` — `AuthUser` gains optional `companyName` / `phone` (so they
  flow through automatically once the API includes them); `clientFromUser()`
  no longer fakes `companyName`, and now carries `memberSince` from
  `user.createdAt`.
- `lib/format.ts` — new `formatMonthYear()` (locale-correct, Hermes-safe
  month name, same approach as `formatDate`).
- `app/(app)/account.tsx` — profile card redesigned: horizontal layout
  (56px avatar left, name + company stacked, left-aligned), then a hairline
  divider and a details block with Mail / Phone / CalendarDays rows for
  email, phone (if present), and "Client since {Month Year}". Company and
  phone rows are hidden when absent, so the card degrades cleanly for
  already-logged-in sessions whose stored client object predates these
  fields (they'll populate on next login).
- `lib/i18n.ts` — added `account.memberSince` in en / sq / de.

`npx tsc --noEmit` from `mobile/` passes. Not checked on device/simulator.

## Still needed for "edit info + password" — API LANE (Agent A) + Buna review

Buna's scoping answers: editable fields = **name, company name, phone**
(NOT email — it's the login identity). Sequencing = ship the card fix now,
build the edit UI once endpoints exist.

Proposed endpoints (all authenticated, client role):

1. **`GET /api/auth/me`** — extend the response to include the client's
   `companyName` and `phone` (currently returns only id/name/email/role/
   clientId). Ideally `login` and `set-password` include them too so the
   card is populated without a follow-up call.
2. **`PATCH /api/auth/me`** (or `/api/clients/me`) — body
   `{ name?, companyName?, phone? }`, updates `User.name` + the linked
   `Client` row, returns the updated shape. Trim/validate; phone is free
   text (no format enforcement for v1 unless Buna wants it).
3. **`POST /api/auth/change-password`** — body
   `{ currentPassword, newPassword }`, verifies the current hash, enforces
   the same ≥8-char rule as `set-password`, rehashes. Note: register and
   forgot-password were cut per SPEC, so this is the only self-serve
   password path for logged-in clients and is new scope — Buna to confirm
   it's wanted before Agent A builds it.

Once those land, mobile work: an "Edit profile" screen (name/company/phone
form) and a "Change password" screen, both reachable from a new row in the
Account settings group, plus `updateProfileRequest` / `changePasswordRequest`
in `lib/api.ts` and an auth-store action to merge the updated client back
into the session.
