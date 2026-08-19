# 2026-08-19 11:24 — Analytics chart grid-paper overlay (web lane)

## What changed

The four Analytics charts with coordinate lines (Revenue over time, Revenue by package,
Turnaround by package, Project aging) already had their real gridlines stretched edge-to-edge
within the chart itself. The ask was to make the *whole card* — the title, description, and any
leftover blank space around the chart — look like the same sheet of graph paper, with the
continuation mathematically matching the real lines exactly, not an approximation.

Added `components/dashboard/charts/analytics-grid-overlay.tsx`, a small client component dropped
into each chart's card as a background layer. At runtime it:

- Finds the chart's real gridlines (marked with `.analytics-gridline` for rows,
  `.analytics-gridline-v` for columns — Project aging's existing dashed vertical ticks are the
  only current user of the vertical axis; the other three charts stayed horizontal-only after
  user feedback that adding new vertical lines through bars/areas changed the chart's own look,
  which wasn't wanted).
- Measures their real pixel pitch, phase, and dash pattern (`stroke-dasharray`) directly from the
  rendered DOM, then draws additional lines at the same pitch/phase filling the rest of the card,
  skipping only the tight bounding box the real lines themselves occupy (not the whole chart
  container) — a chart with extra chrome above its lines, like Project aging's legend row, still
  gets the line continued behind it rather than leaving a gap.
- Computes a matching `stroke-dashoffset` per continuation segment so a dashed real line doesn't
  visibly break step where the continuation picks up.
- Re-measures on both `ResizeObserver` (card layout changes) and `MutationObserver` scoped to the
  chart's own canvas element (catches the chart redrawing at a stable card size, e.g. Recharts'
  `ResponsiveContainer` correcting its initial default width after mount — this was the source of
  one visible misalignment bug during the session).

## Why not just a CSS background gradient

First attempt used a `repeating-linear-gradient` background instead of real SVG lines. It produced
a visible "double line" artifact: CSS gradients and SVG strokes rasterize sub-pixel positions with
different antialiasing, so even mathematically-identical positions could render as two adjacent
hairlines instead of merging into one. Switched to drawing actual SVG `<line>` elements matching
the real ones' technique, which is indistinguishable by construction.

## Verification

- `npx tsc --noEmit`: passed.
- `npx eslint .`: passed (repo-wide; only the two pre-existing `<img>` warnings in
  `components/marketing/mobile-app-section.tsx` remain).
- Manually verified in the browser (Claude in Chrome) across light/dark and a narrower viewport:
  gridline continuation is pixel-aligned with the real lines, no double lines, dash phase is
  continuous across the legend-row seam in Project aging, and the other three charts' plot areas
  are untouched (no new lines drawn through bars/areas).

## Scope note

This commit also includes pre-existing uncommitted web-lane changes that were already in the tree
before this session started (invoices table Sent column, `analytics-card` class unification,
topbar notification open-state tracking, language-select `compact` trigger, overview card
treatments). Those were not authored in this session; bundled in because they live in the same
files touched here and the user asked to commit everything pending. `app/api/invoices/*` changes
were left uncommitted — those belong to the API lane, not web.
