# 2026-08-27 18:10 — Claude Code — skeleton loading states

Buna: loading should show skeletons, not empty screens.

## New component

`mobile/components/ui/Skeleton.tsx`:
- `Skeleton` — a box (width/height/radius) with one **shared** pulse
  (opacity 1 → 0.45, ~900ms each way, native driver) so all blocks on a
  screen breathe in sync. Fill is `color.surfaceMuted`, theme-aware.
- `SkeletonText` — a stack of line skeletons, last line shortened.
- Composites matching real rows: `ProjectCardSkeleton`, `InvoiceRowSkeleton`,
  `NotificationRowSkeleton`, `NoteBubbleSkeleton` ({ mine }), `KpiCardSkeleton`.

## Screens wired

| Screen | Before | Now |
|---|---|---|
| Home | `EmptyState` shown during first fetch (no loading flag) | added local `loading`; `HomeSkeleton` (status card + 2 stat cards + 3 activity rows) |
| Projects list | same — no loading flag | added local `loading`; 3 × `ProjectCardSkeleton` |
| Project detail | flashed **"project not found"** while loading | added local `loading`; `ProjectDetailSkeleton` (status card w/ ring + 2 section cards); "not found" only when `!loading` |
| Project notes | `ActivityIndicator` | 4 alternating `NoteBubbleSkeleton` |
| Invoices tab | `ActivityIndicator` | 2 × `KpiCardSkeleton` + 4 × `InvoiceRowSkeleton` |
| Project invoices | `ActivityIndicator` | 3 × `InvoiceRowSkeleton` |
| Invoice detail | `ActivityIndicator` | title/amount/detail-row/button skeleton |
| Notifications | already had `EmptyState` gate on `notificationsLoading` | now 6 × `NotificationRowSkeleton` under a label skeleton |

Notes/invoice-detail/etc. keep their existing `loading && !data` guards, so a
cached value still renders instantly and only a genuine cold load shows the
skeleton. Auth screens and the checkout flow keep their spinners (button
spinners / a genuine "waiting on Stripe" state — not content loading).

`npx tsc --noEmit` from `mobile/` — clean. Not run on device.

## 2026-08-27 18:25 — follow-up

Project detail: the `loading` flag only gated the whole-screen fallback, so a
cached project rendered the Notes and Invoices **sections** with their empty
states while those fetches were still running. Now `loading` starts true
regardless of project cache and each section shows a skeleton when it has no
data yet (`loading && section.length === 0`) — a cached list still renders
instantly. Notes count footer hidden during the section skeleton.
