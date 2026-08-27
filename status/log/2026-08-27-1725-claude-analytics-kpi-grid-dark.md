# 2026-08-27 17:25 — Claude Code — analytics KPI grid pattern in dark mode

Per Buna: the KPI strip on the analytics page shows the graph-paper square
pattern in light mode but not dark mode.

Cause: `.dark .crm-shell .analytics-page .crm-kpi-strip` used the `background`
shorthand (`background: var(--card)`), which reset `background-image` to none,
and never re-declared the two crossing linear-gradients that draw the grid.

`app/globals.css`:

- Dark rule now sets `background-color` (not the shorthand) and re-declares the
  same `background-image` / `background-size` gradient pair as the light rule.
- Bumped `--crm-kpi-grid-line` for dark from `rgb(255 255 255 / 0.035)` to
  `0.05` so the lines are actually visible against `--card`.

CSS-only. `npm run verify` still reports the two pre-existing lint errors in
`components/dashboard/settings-content.tsx` and `stat-tile.tsx` (unrelated,
present on main before this change). Not viewed in a running browser.
