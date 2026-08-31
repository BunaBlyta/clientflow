### 2026-08-11 16:09 — web agent — project package summary

Changed:
- Added the additive `ProjectPackage` web type with numeric major-unit price and
  currency fields.
- Replaced the project detail page's `getPackage` mock lookup with the `package`
  object already included in the live project response.
- Added currency-aware formatting for the serialized package price without parsing
  or converting the API number.
- Removed the package-data TODO.

Tried and abandoned (what didn't work, and why):
- Tried to complete the requested signed-in browser flow. The browser runtime had
  zero available backends, so the status change, activity refresh, hard refresh, and
  narrow/wide checks could not be performed honestly.
- The normal Turbopack build hit the documented sandbox port restriction; the
  webpack fallback passed.

Left for next session:
- Re-run the required browser flow when a browser backend is available.

Assumptions made (flag if wrong):
- The API's `price` value is in major currency units as documented, so the display
  formatter receives it directly and only uses the returned currency code.

Blockers:
- Browser runtime unavailable in this environment; click-through verification
  remains pending.
