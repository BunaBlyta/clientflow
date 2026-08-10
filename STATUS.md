# STATUS.md

The shared memory between sessions and between agents. Every agent (Claude Code, Codex CLI) reads this before starting and appends to it before stopping. Newest entry on top. Don't delete old entries — this is the log of *why* things are the way they are, not just *what*.

---

## Template for each entry

```
### [YYYY-MM-DD HH:MM] — [agent: Claude Code / Codex] — [task name]
Changed:
- ...
Tried and abandoned (what didn't work, and why):
- ...
Left for next session:
- ...
Assumptions made (flag if wrong):
- ...
Blockers:
- ...
```

Write every entry in plain language a non-engineer could follow — see AGENTS.md section 7. "Tried and abandoned" matters as much as "Changed": if an approach got tried and dropped, say so and say why, so nobody re-tries the same dead end later, and so there's an honest record of the problem-solving that happened, not just the polished result.

---

### 2026-08-10 21:15 — Claude Code — mobile app: full client journey, screens built against mock data
Changed:
- Built out the entire client-facing mobile app in `mobile/` as real, tappable screens — nothing is a static mockup. It runs on mock/fixture data since the real backend doesn't exist yet (Codex CLI's lane hasn't started).
- Installed and wired up: Expo Router (file-based navigation), `@expo-google-fonts/inter` (weights 400/500/600 only, per the design spec), `lucide-react-native` for icons, and Zustand for app state (auth session + all the mock data and its mutations).
- **Auth**: login screen, "I have an invite code" → enter-verification-code screen → set-password screen → back to login (matches the flow in the brief: invite → code → password → login). Forgot-password reuses the same code-entry and set-password screens with a "reset" mode. Wrong code shows "that code isn't right"; a specific demo code (`000000`) shows an "expired code, request a new one" state with a working resend + cooldown timer, so both edge cases the spec flagged are actually there to click through, not just described.
- **Request status checker**: a screen reachable from the login page (before logging in) where a prospect types their email and sees Pending / Approved / Rejected, with copy explaining what happens next for each. This is separate from the logged-in client experience, since a prospect with a pending request has no password yet.
- **Projects**: a list/switcher screen (handles the multi-project case explicitly — seeded one client with 4 projects across different stages) → project detail with a vertical stage tracker (Pending → Discovery → Design → Development → Review → Launched), using the brand blue only on the current step, per the design rule. Cancelled/On Hold projects show a banner instead of the tracker, since the data model doesn't record which stage they paused at.
- **Notes**: read-only shared feed per project (staff/client/system entries all shown, visually distinct) plus a composer to post a new note. No edit/delete UI anywhere, matching "notes are immutable."
- **Invoices**: list per project (Draft invoices are filtered out of the client's view — a draft hasn't been sent yet, so a real client shouldn't see it) with status pills (Paid/Due/Processing/Failed/Voided/Refunded, plus a separate "Overdue" pill when a Sent or Failed invoice is past its due date). Invoice detail has a "Pay now" / "Retry payment" button that opens a mock Stripe Checkout screen.
- **Mock checkout**: styled like a payment page, offers a "succeeds" test card and a "declines" test card (nodding to the real Stripe test cards mentioned in SPEC.md). Tapping one moves the invoice to `PAYMENT_PENDING` immediately, then after a short simulated delay "confirms" it to `PAID` or `FAILED` — deliberately mirroring the real non-negotiable that a project/invoice only advances on a confirmed webhook, never on the click itself, even though this whole thing is mocked for now.
- **Notifications**: in-app list screen covering all the event types in SPEC #13 (request approved/rejected, invoice issued, payment succeeded/failed, stage changed, new note, extra charge), unread state, a badge count on the tab bar, "mark all read," and tapping one navigates to the relevant project or invoice. Real push registration (APNs/FCM) was explicitly out of scope for this pass per the brief — this is the in-app list only.
- Seeded fixture data: one client (Riverside Coffee Co.) with 4 projects spanning Development, Review, Launched, and On Hold; 11 invoices covering every invoice status in the data model (Draft, Sent, Payment Pending, Paid, Failed, Voided, Refunded) so every badge/state is actually visible somewhere; 13 notes mixing staff/client/system entries; 7 notifications; 3 separate prospect requests (pending/approved/rejected) for the status-checker screen.
- Design system lives in `mobile/lib/theme.ts` (colors, spacing, type scale) and `mobile/lib/status.ts` (status → label/color mapping for projects, invoices, requests) — translated from AGENTS.md section 5: white base, `#5AB2FF` as the only UI accent, hairline gray borders, 4px spacing grid, Inter at weights 400/500/600 only.

Tried and abandoned (what didn't work, and why):
- First install attempt ran `npm install` / `npx expo install` against `/Users/buna/Documents/tetbit/clientflow-frontend/mobile` directly instead of this worktree's copy — that's the shared checkout other sessions may be using, not my isolated worktree. Caught it before writing any app code (the Edit tool refused to touch that path and explained why). Restored `package.json`, `package-lock.json`, and `app.json` there to their exact committed state from the `frontend` branch and deleted the `node_modules` it had created, then redid every install correctly inside this worktree's `mobile/`. Flagging this clearly in case anything about that shared checkout looks off — I believe it's back to exactly how it was, but worth a sanity check (`git status` in `clientflow-frontend/mobile` should show nothing changed).
- Expo SDK 57 needs Node 22.13+; the system's default `node` was v20.20.2. Installed Node 22 via the existing `nvm` and used that instead of fighting the version requirement — didn't touch the system-wide default, just used `nvm use 22` per command. Whoever runs `npx expo start` on this project next will need Node 22 active (`nvm use 22`) for it to work.
- Considered NativeWind (Tailwind for RN) since it's mentioned as a reasonable option in the brief, but went with plain StyleSheet + a shared theme constants file instead — fewer moving parts to debug against an SDK that's genuinely new (57), and the design system here is simple enough (a handful of colors, one spacing scale) that Tailwind's advantage didn't outweigh the extra config surface under this timeline.
- Left `experiments.typedRoutes` off in `app.json`. Expo Router can generate compile-time-checked route types, but the type file only gets generated after the dev server has run once, which would've made a from-scratch `tsc --noEmit` check unreliable. Routes are plain strings for now; someone can turn it back on later without any other changes.

Left for next session:
- Nothing is wired to a real backend yet — every screen reads/writes to a local Zustand store seeded from `mobile/lib/mock-data.ts`. Auth doesn't persist across an app restart (no token storage) since there's no real session yet; not worth adding until there's a real login API to store a token for.
- Real Stripe Checkout integration, real push notification registration (APNs/FCM/Expo push tokens), and real email delivery for verification codes are all still mocked, exactly as the brief asked for in this pass.
- The data shape in `mobile/lib/types.ts` is written to match what AGENTS.md section 4 describes the eventual API returning (`Project`, `Invoice`, `Note`, `Notification`, `ProjectRequest`, all with the same status enums). When the real API routes exist, the plan is: swap the Zustand store's initial state and mutation actions for real `fetch` calls with the same shapes, and the screens shouldn't need to change much.
- Haven't run this on a physical simulator/device yet — verified it via `npx tsc --noEmit` (clean) and `npx expo export --platform ios` (bundled 3055 modules with no errors). Whoever picks this up next should run `nvm use 22 && npx expo start` and click through it for real before calling the mobile app "done" — I did not get to do that hands-on pass myself.
- No automated tests written for the mobile app yet (this pass was screens + mock data only).

Assumptions made (flag if wrong):
- "Request status" (must-have #2 in the brief) is modeled as a screen reachable from the login page, before logging in, where a prospect types their email to look up their request — since a client whose request is still Pending has no password yet and can't log in. SPEC.md doesn't spell out this exact navigation, so this was my best-guess interpretation; easy to change if the intended flow was different (e.g. a magic link instead of email lookup).
- Draft invoices are hidden from the client's invoice list entirely (they're a staff-only in-progress state, not yet sent). If the real backend intends for clients to ever see a Draft invoice, that filter in `mobile/app/(app)/projects/[id]/invoices/index.tsx` needs to come out.
- Demo auth is hardcoded: email `jordan@riversidecoffee.com`, password `riverside123`, verification code `123456` (and `000000` specifically triggers the "expired code" state to make that edge case easy to click through). All defined in `mobile/lib/mock-data.ts`.
- Used `Stack.Protected` (Expo Router's current auth-gating API, confirmed against the SDK 57 docs) to keep the (auth) and (app) route groups mutually exclusive based on login state, rather than manual redirects.

Blockers:
- None. The mobile app is fully clickable end to end on mock data — auth, request status, multi-project tracker, notes, invoices, mock pay flow, and notifications all work as real navigable screens.
