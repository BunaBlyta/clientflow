### 2026-08-17 00:44 — mobile agent — home spacing and tracker readability

Changed:
- Removed Home’s custom top padding so its header aligns with Projects,
  Notifications, Invoices, and Account.
- Moved the active “currently in progress” message out of the narrow stage
  label column and made it a readable centered line below the timeline.
- Preserved the existing tracker stages, active-state animation, and navigation.

Tried and abandoned:
- Keeping the message inside the active stage column was rejected because the
  six-column layout forced it to become too small and risked overlap.

Left for next session:
- Review the new tracker height on a physical device and with translated text.

Assumptions made:
- A shared centered activity line is clearer than repeating the current state
  inside a narrow stage label slot.

Blockers:
- No connected simulator/browser was available for visual QA.
