### 2026-08-12 08:48 — Claude (Cowork) — read-only contract audit (Lane D, per docs/PLAN-WED-2026-08-12.md)

**What this is:** cross-checked every `fetch(`/API-client call in the web app
(`app/(dashboard)/`, `app/(marketing)/`, `components/`, `lib/`) and the mobile app
(`mobile/app`, `mobile/components`, `mobile/lib`, `mobile/store`) against the routes
and verbs that actually exist in `app/api/`. No code was changed. Every claim below
was read directly from the file named — grep/read commands are given so anyone can
re-check in seconds.

**Full API surface today** (`app/api/**/route.ts`, verbs only):
```
POST   /api/auth/login
POST   /api/auth/set-password
POST   /api/auth/verification/send
POST   /api/auth/verification/verify
GET    /api/clients
GET,PATCH /api/invoices/[id]
GET    /api/invoices
GET    /api/notes
GET    /api/notifications
GET    /api/packages
GET,PATCH /api/projects/[id]
GET    /api/projects
GET,POST  /api/requests
PATCH  /api/requests/[id]
POST   /api/stripe/checkout
POST   /api/stripe/webhook
```

## Finding 1 — the entire request pipeline is disconnected from the web UI, not just approve/reject

`STATUS.md` says "request approve/reject and resend-invitation are not [wired]."
That undersells it. **Nothing in the web app calls `/api/requests` at all** — not
the submission, not the list, not the approval.

- `components/marketing/packages-and-request.tsx:26,40` — the landing-page request
  form calls `useAppStore((s) => s.submitProjectRequest)`, which only writes to the
  in-memory Zustand store. A prospect "submitting" a request today does not create a
  `ProjectRequest` row and is gone on refresh.
- `app/(dashboard)/dashboard/projects/page.tsx:258-352` — the staff "Requests" tab
  (`RequestsTable`) reads `useAppStore((s) => s.projectRequests)` and its
  Approve/Reject buttons call `approveRequest`/`rejectRequest` from the same store
  (lines 260-261, 319, 352) — not `PATCH /api/requests/[id]`.
- Re-check: `grep -rn "/api/requests" app components lib` matches only the two test
  files under `app/api/requests/`.

Consequence: the backend chain Agent A proved on 11 Aug (request → approve →
verification email, tested directly against the API for
`bunablyta@gmail.com`) has never been exercised through the actual staff dashboard
or landing page. If Flow A is demoed by clicking the real UI today, nothing in that
first step touches the database at all.

**This is presumably next for the web lane** — `status/briefs/2026-08-12-write-endpoints-api.md`
doesn't list it explicitly (it covers invoices/notes/notifications/packages/auth-me/
resend-invite), so flagging in case it was assumed rather than scoped. Wiring the
Requests tab and the landing-page form to the real endpoints looks like it belongs
in this list.

## Finding 2 — mobile's onboarding screens call no API at all, not even the ones that exist

`mobile/lib/api.ts` is the only real API client on mobile (91 lines, one `request()`
wrapper). It has functions for `login`, `project`, `projects`, `invoices`,
`invoice`, and `checkout` only. It has **no function for verification-send,
verification-verify, or set-password.**

- `mobile/app/(auth)/verify-code.tsx:7-11` imports straight from
  `../../lib/mock-data`.
- `mobile/app/(auth)/set-password.tsx` has no `api` or `fetch` import at all —
  grep for `fetch(\|api\.` returns nothing in that file.

This matches `CURRENT-mobile.md`'s "verification codes are still fixtures," just
more specific: these two screens don't call `/api/auth/verification/verify` or
`/api/auth/set-password` yet, even though both endpoints exist server-side today.
Consistent with the plan — mobile's next task is gated on the API's task 1 in
`status/briefs/2026-08-12-flow-a-repair-api.md` landing first.

## Finding 3 — `GET /api/packages` (public pricing) has zero callers

Re-check: `grep -rn "/api/packages" app components lib mobile/lib/api.ts` — the only
hits are internal (`app/api/projects/route.ts` and `[id]/route.ts` importing the
serializer for the package summary). The marketing pricing section
(`packages-and-request.tsx:24`) and `/dashboard/settings` both still read
`useAppStore((s) => s.packages)`. `STATUS.md` already flags this
("the marketing pricing is the cheapest, since `GET /api/packages` now exists") —
confirmed still true, nothing has picked it up yet.

## Finding 4 — no response-field drift found on the paths that ARE wired

Compared `app/api/invoices/serialize.ts`'s output against both frontend `Invoice`
types (`lib/types.ts` and `mobile/lib/types.ts`). Both declare exactly
`id, projectId, kind, label, amountCents, status, dueDate?, paidAt?, createdAt` and
the serializer emits exactly that set (plus `clientId`, which neither frontend type
declares — harmless, just unused, not a bug). The `InvoiceKind`/`CUSTOM` drift noted
in earlier logs looks fixed; found no other mismatch this pass. Did not check every
serializer field-by-field against every consumer (`/api/projects/[id]`'s response
in particular is large) — this was a sampled check on invoices specifically, not a
full pass.

## Endpoints confirmed correctly wired (verbs and paths both match, spot-checked)

`patchJson` calls in `invoice-row-actions.tsx` → `PATCH /api/invoices/${id}`, and
`project-status-menu.tsx` → `PATCH /api/projects/${id}` — both match real routes.
`app/(dashboard)/dashboard/projects/[id]/page.tsx` calls `/api/notes?projectId=`,
`/api/projects/${id}`, `/api/clients`, `/api/invoices?projectId=` — all real GETs.
`login-form.tsx` → `POST /api/auth/login` — matches.

## Not covered in this pass

- Field-by-field diff of `/api/projects`, `/api/projects/[id]`, `/api/notes`,
  `/api/clients`, `/api/notifications` responses against every consumer — only
  invoices got the full diff.
- Anything inside `app/api/**` calling itself (server-to-server) — out of scope,
  the brief asks about frontend callers only.
- Mobile's `store/` state layer beyond the two onboarding screens — not fully read.

Assumptions made (flag if wrong):
- Assumed "the web app" means everything under `app/(dashboard)/`,
  `app/(marketing)/`, `app/(auth)/`, `components/`, `lib/` per the brief's own list.
- Assumed test files (`*.test.ts`) calling `/api/requests` directly don't count as
  "the frontend calling it" — they're backend tests of the route itself.

Left for next session: decide whether "wire the Requests tab + landing-page form to
the real API" belongs in tonight's write-endpoints brief or is a separate task —
it wasn't explicitly scoped there. No code was touched to fix any of this.
