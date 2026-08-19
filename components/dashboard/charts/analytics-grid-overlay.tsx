"use client";

import { useEffect, useRef, useState } from "react";

type Axis = { pitch: number; phase: number; dasharray: string | null; dashOrigin: number } | null;

type Measurement = {
  cardWidth: number;
  cardHeight: number;
  horizontal: Axis;
  vertical: Axis;
  excludeTop: number;
  excludeBottom: number;
};

function pitchAndPhase(lines: SVGLineElement[], positions: number[], dashOrigins: number[]): Axis {
  if (positions.length < 2) return null;
  const sorted = [...positions].sort((a, b) => a - b);
  const deltas = sorted.slice(1).map((v, i) => v - sorted[i]).filter((d) => d > 0.5);
  if (!deltas.length) return null;
  const pitch = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
  const phase = ((sorted[0] % pitch) + pitch) % pitch;
  const dasharray = lines[0]?.getAttribute("stroke-dasharray") ?? null;
  const dashOrigin = dashOrigins[0] ?? 0;
  return { pitch, phase, dasharray, dashOrigin };
}

function pointsAlong(axisLength: number, axis: Axis): number[] {
  if (!axis || axisLength <= 0) return [];
  const { pitch, phase } = axis;
  const firstK = Math.ceil((0 - phase) / pitch);
  const lastK = Math.floor((axisLength - phase) / pitch);
  const points: number[] = [];
  for (let k = firstK; k <= lastK; k++) points.push(phase + k * pitch);
  return points;
}

// SVG dash patterns restart at distance 0 for every new line element, so a
// continuation segment butting up against the real line's own dashes needs
// a matching `stroke-dashoffset` or the dots visibly break step at the seam.
function dashCycleLength(dasharray: string | null): number {
  if (!dasharray) return 0;
  const values = dasharray.split(/[\s,]+/).map(Number).filter((n) => Number.isFinite(n) && n >= 0);
  if (!values.length) return 0;
  const list = values.length % 2 === 0 ? values : [...values, ...values];
  return list.reduce((sum, v) => sum + v, 0);
}

function dashOffsetFor(segmentStart: number, axis: Axis): number | undefined {
  const cycle = dashCycleLength(axis?.dasharray ?? null);
  if (!axis || !cycle) return undefined;
  return ((segmentStart - axis.dashOrigin) % cycle + cycle) % cycle;
}

/**
 * Reads the real, already-rendered chart gridlines (elements marked
 * `.analytics-gridline` for rows, `.analytics-gridline-v` for columns)
 * inside the nearest `.analytics-card` ancestor and continues that exact
 * pitch/phase as extra SVG lines filling the rest of the card (title,
 * description, footer), so the whole card reads as one sheet of graph
 * paper. An axis with no real lines to measure (e.g. a chart that never
 * draws vertical gridlines) contributes nothing — this never invents a
 * pattern the chart itself doesn't already have. Lines are also never
 * drawn over the chart's own bounding box (`.analytics-chart-canvas`) —
 * the chart already draws its own lines there, and doubling a line on
 * top of another at the same sub-pixel position is what produced the
 * original "double line" artifact.
 */
export function AnalyticsGridOverlay({ dependency }: { dependency?: unknown }) {
  const overlayRef = useRef<SVGSVGElement>(null);
  const [measurement, setMeasurement] = useState<Measurement | null>(null);

  useEffect(() => {
    const svg = overlayRef.current;
    const card = svg?.closest<HTMLElement>(".analytics-card");
    const canvas = card?.querySelector<HTMLElement>(".analytics-chart-canvas");
    if (!svg || !card || !canvas) {
      setMeasurement(null);
      return;
    }

    const measure = () => {
      const cardRect = card.getBoundingClientRect();

      const hLines = Array.from(canvas.querySelectorAll<SVGLineElement>(".analytics-gridline"));
      const vLines = Array.from(canvas.querySelectorAll<SVGLineElement>(".analytics-gridline-v"));
      const ys = hLines.map((line) => line.getBoundingClientRect().top - cardRect.top);
      const xs = vLines.map((line) => line.getBoundingClientRect().left - cardRect.left);
      // The dash pattern's own anchor: where each real line starts (its own
      // leading edge), used to keep continuation segments in phase with it.
      const hDashOrigins = hLines.map((line) => line.getBoundingClientRect().left - cardRect.left);
      const vDashOrigins = vLines.map((line) => line.getBoundingClientRect().top - cardRect.top);

      // Exclude only the tight bounding box the real lines themselves
      // occupy — not the whole `.analytics-chart-canvas` box, which can
      // also contain chrome (e.g. a legend row) that sits above where the
      // lines actually start. Continuation lines should run behind that
      // chrome too rather than stopping short and leaving a gap.
      const allLines = [...hLines, ...vLines];
      let excludeTop = Infinity;
      let excludeBottom = -Infinity;
      for (const line of allLines) {
        const r = line.getBoundingClientRect();
        excludeTop = Math.min(excludeTop, r.top - cardRect.top);
        excludeBottom = Math.max(excludeBottom, r.bottom - cardRect.top);
      }

      setMeasurement({
        cardWidth: cardRect.width,
        cardHeight: cardRect.height,
        horizontal: pitchAndPhase(hLines, ys, hDashOrigins),
        vertical: pitchAndPhase(vLines, xs, vDashOrigins),
        excludeTop,
        excludeBottom,
      });
    };

    // A card-level resize (window resize, sidebar toggle, grid reflow) is
    // caught by the ResizeObserver. But the chart itself can also redraw at
    // a stable card size — e.g. Recharts' ResponsiveContainer correcting an
    // initial default width via its own internal ResizeObserver — which
    // changes line positions without changing the card's own box, so it
    // needs the MutationObserver on the canvas to be caught too. Scoping
    // both to the canvas/card (never our own overlay `svg`, which is a
    // sibling, not a descendant, of the canvas) means our own line updates
    // can't re-trigger this effect.
    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(card);
    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(canvas, { attributes: true, childList: true, subtree: true });
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [dependency]);

  const cardWidth = measurement?.cardWidth ?? 0;
  const cardHeight = measurement?.cardHeight ?? 0;
  const excludeTop = measurement?.excludeTop ?? Infinity;
  const excludeBottom = measurement?.excludeBottom ?? -Infinity;
  const hAxis = measurement?.horizontal ?? null;
  const vAxis = measurement?.vertical ?? null;
  const hDash = hAxis?.dasharray ?? undefined;
  const vDash = vAxis?.dasharray ?? undefined;

  const rowYs = pointsAlong(cardHeight, hAxis).filter((y) => y < excludeTop - 0.5 || y > excludeBottom + 0.5);
  const colXs = pointsAlong(cardWidth, vAxis);
  const vTopOffset = dashOffsetFor(0, vAxis);
  const vBottomOffset = dashOffsetFor(excludeBottom, vAxis);

  return (
    <svg ref={overlayRef} aria-hidden className="pointer-events-none absolute inset-0 z-0 h-full w-full">
      {rowYs.map((y) => (
        <line
          key={`h-${y}`}
          x1={0}
          x2="100%"
          y1={y}
          y2={y}
          stroke="var(--analytics-border, var(--border))"
          strokeWidth={1}
          strokeDasharray={hDash}
          strokeDashoffset={dashOffsetFor(0, hAxis)}
        />
      ))}
      {colXs.map((x) => (
        <g key={`v-${x}`}>
          {excludeTop > 0 && (
            <line
              x1={x}
              x2={x}
              y1={0}
              y2={excludeTop}
              stroke="var(--analytics-border, var(--border))"
              strokeWidth={1}
              strokeDasharray={vDash}
              strokeDashoffset={vTopOffset}
            />
          )}
          {excludeBottom < cardHeight && (
            <line
              x1={x}
              x2={x}
              y1={excludeBottom}
              y2={cardHeight}
              stroke="var(--analytics-border, var(--border))"
              strokeWidth={1}
              strokeDasharray={vDash}
              strokeDashoffset={vBottomOffset}
            />
          )}
        </g>
      ))}
    </svg>
  );
}
