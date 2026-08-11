# Brief — Mobile lane: verification code, set password, first login

**Written by Buna's Cowork session, 2026-08-11. You own `mobile/` and
`status/CURRENT-mobile.md`. Nothing else.**

Read `AGENTS.md` (design rules §5), then `docs/HANDOVER-2026-08-11.md`, then
`status/CURRENT-mobile.md` and `status/CURRENT-api.md`.

**You are blocked on the API lane.** Read `status/CURRENT-api.md` for the shapes
that actually shipped and code against those, not against this brief, if they
differ.

---

## Why this task

`mobile/app/(auth)/verify-code.tsx`, `set-password.tsx` and `request-status.tsx`
are fixtures — they render a convincing flow that talks to nothing. Login,
projects, invoices and Stripe checkout are already live against the real API, so
this is the one remaining gap between "a client was approved" and "a client is
in the app looking at their deposit invoice".

Auth with email verification codes is on the mentor's required feature list.

## What to build

### 1. Verify code

`verify-code.tsx` calls `POST /api/auth/verification/verify` with the email and
the code the client received.

**Both error states must be real and clearly different from a crash:** a wrong
code and an expired code. The API returns the same generic message for both by
design — do not try to distinguish them, and do not invent a more specific
message than the server gives you. This is called out in `docs/SPEC.md` as an
edge case to test deliberately.

Add a "resend code" affordance calling `POST /api/auth/verification/send`. That
endpoint returns `{ sent: true }` even for an unknown email, on purpose — show
the same "check your inbox" state either way. Do not leak whether the account
exists.

### 2. Set password

`set-password.tsx` calls the API lane's new set-password endpoint with email,
code and the new password. On success it returns a session in the same shape
`login` returns — store it exactly the way `auth-store.ts` stores a login
session, and go straight into the app rather than bouncing the client back to
the login screen to type credentials they just created.

Show the server's password-rejection message rather than inventing client-side
rules that might disagree with it.

### 3. Request status

`request-status.tsx` should reflect a real pending/approved/rejected request
rather than a fixture. If no endpoint exists for a prospect to check this
without an account, **do not build one and do not guess** — say so, leave the
screen as it is, and flag it in your status file.

### 4. The whole chain, once

After the pieces work, run it end to end as a client would: open the emailed
code, verify, set a password, land in the app, see the project, see the deposit
invoice, pay it with Stripe test card `4242 4242 4242 4242`, and confirm the
invoice moves to Paid.

## Do not

- Do not touch `app/`, `components/`, `lib/` or `prisma/` in the web project.
- Do not run `npm install` in either project. Print the command and stop.
- Do not create a git worktree or branch.
- Do not add a self-registration path for clients. Clients are only ever created
  by an approved request or manually by staff — `AGENTS.md` §4 is explicit.

## Definition of done

- **Run on a real device or simulator, not only `expo start --web`.** As of
  2026-08-11 this app has never been run on either, which is the single biggest
  untested risk in the project. A layout that works in the browser is not
  evidence. Expo Go's SDK version lags — see the handover for the gotchas,
  including the `exp://` camera issue.
- Wrong code and expired code both produce a clear, non-crashing error.
- The full chain above completes, ending in a Paid invoice.
- Design rules held. Check the tab bar specifically — it rendered as a broken
  vertical stack for days and no tooling caught it.
- Committed with `git add mobile/ status/` (never `-A`) and **pushed**. If you
  cannot verify on a device, commit anyway and say so plainly — do not sit on
  uncommitted work, and do not claim verification you did not do.
- `status/CURRENT-mobile.md` overwritten and a NEW file in `status/log/`.

## Before writing code

Three lines: current state, what you will change, and anything already stale.
Then wait for confirmation.
