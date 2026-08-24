# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-24 15:10 by Codex — clean tab-owned detail navigation

## What changed

- Replaced per-screen focus animations with one native-driven, 180ms tab transition owned by the tab navigator. All tab scenes are pre-mounted and kept attached so first visits and preserved nested screens switch consistently.
- Restored native stack motion for drill-down navigation while preventing a second stack animation during cross-tab entries.
- Gave Invoices its own nested stack. Opening an invoice, entering checkout, and returning from checkout now keep the Invoices tab active; the Projects tab is never used as an intermediate route.
- Gave Notifications its own nested stack. Notification targets, Notes, invoice lists, invoice details, and checkout remain inside Notifications, and Back returns through the notification-origin flow.
- Reused the existing project, notes, invoice, and checkout screens through thin route wrappers rather than duplicating business or payment logic.
- Replaced native navigation headers across app detail and auth flows with one compact, borderless Lucide left-arrow control. It keeps a 44px touch target and localized accessibility label without reserving a full header.
- Removed the fade layer from tab transitions so outgoing invoice/notification content cannot ghost through the incoming tab.
- Kept the web tab fallback unanimated because the navigation issue being solved is native-only.

## Verification

- `cd mobile && npx tsc --noEmit`: passed.
- `cd mobile && npx expo export --platform ios --output-dir /private/tmp/clientflow-mobile-ios-notifications-stack`: passed.
- `git diff --check -- mobile`: passed.
- A native iOS Simulator development build compiled and installed successfully earlier in this task.
- `npm run verify` from the repository root reached lint and stopped on two unrelated web-lane errors in `components/dashboard/date-picker.tsx` and `components/dashboard/settings-content.tsx`; mobile-owned files were not involved.
- User verified the final Invoices and Notifications navigation behavior on device and approved it as “very good.”

## Current state

- Bottom-tab switching uses one consistent navigator-level transition.
- Invoices and Notifications own their detail navigation stacks and keep their tab active throughout their flows.
- Projects owns project-origin drill-down navigation with native push/back motion.
- All visible back controls use the same app-owned icon-only treatment.
- Auth, API calls, data stores, notification refresh/realtime behavior, and webhook-backed payment state remain unchanged.

## Known limits

- Route-tree changes require a full Metro restart with `npx expo start -c`; Fast Refresh can retain stale tab registrations.
- Home shortcuts still open their canonical Project routes in the Projects tab.
- Root verification remains blocked by unrelated web-lane lint errors; do not fix those from the mobile lane.

## API seam

- No API contract changes were made.
