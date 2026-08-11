# CURRENT — auth vertical (Agent A)

**You are the only writer of this file. Overwrite it before you stop.
Do not edit another agent's CURRENT-*.md.**

Last updated: 2026-08-11 by Claude (Cowork) — initial setup

## What exists

- `POST /api/auth/login` works: email + password, returns `{ user, token }`,
  also sets the token as an HTTP-only cookie. Verified against real seeded data.
- `app/api/_lib/auth.ts` — HMAC-SHA256 signed stateless tokens, scrypt password
  hashing, `getAuthenticatedUser()` accepting cookie or `Authorization: Bearer`.
  Throws at load if `SESSION_SECRET` is missing in production. One test covers
  wrong-key rejection.
- The `User` table already has `verificationCodeHash`, `verificationCodeExpiresAt`,
  `passwordResetTokenHash`, `passwordResetExpiresAt`, `invitationTokenHash`,
  `invitationExpiresAt`. **The columns you need are already there — no migration
  should be necessary.**
- Demo logins: `sam@clientflow.studio` / `clientflow-demo` (staff),
  `jordan@riversidecoffee.com` / `riverside123` (client).

## What is missing — this is your job

1. **There is no login UI on web at all, and `/dashboard` is publicly reachable.**
   Anyone can open it. Needs a login page plus `middleware.ts` route protection.
   This is a required feature currently at zero.
2. **Email verification codes are fake.** `mobile/app/(auth)/verify-code.tsx`
   compares the typed code against the constant `'123456'` in
   `mobile/lib/mock-data.ts`. No email is ever sent; there is no network call in
   the mobile app at all. The "resend" button only runs a cooldown timer.
   Needs: an endpoint that generates a code, hashes it into the existing columns
   with an expiry, and sends it via Resend (`RESEND_API_KEY` is already in `.env`);
   an endpoint that checks a submitted code; and the mobile screens calling both.
3. Forgot-password and set-password are screens only, same situation.
4. Mobile has no session persistence — no token storage, so login does not survive
   an app restart. Worth fixing once login is real.

## Notes

- There is no `User` type in `mobile/lib/types.ts`. Web's is in `lib/types.ts`.
  Both are shared files — propose changes through Buna, do not edit directly.
- Add a test for tampered-payload rejection (swap `sub` in the payload, keep the
  original signature — it must return null). Currently only wrong-key is tested.

## Yours to touch

`app/api/auth/**`, `app/api/_lib/auth.ts`, `app/(auth)/**`, `middleware.ts`,
`mobile/app/(auth)/**`, `mobile/store/auth-store.ts`, and this file.
