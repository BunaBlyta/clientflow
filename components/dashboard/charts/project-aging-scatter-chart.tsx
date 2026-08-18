"use client";

import { useEffect, useRef, useState } from "react";

type ProjectAgingPoint = {
  id: string;
  name: string;
  stage: string;
  ageDays: number;
};

const DEFAULT_WIDTH = 640;
const CHART_HEIGHT = 270;
const LEFT = 92;
const RIGHT = 20;
const TOP = 12;
const BOTTOM = 42;

export function ProjectAgingScatterChart({
  data,
  stages,
  xAxisLabel,
}: {
  data: ProjectAgingPoint[];
  stages: string[];
  xAxisLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const chartWidth = containerWidth || DEFAULT_WIDTH;
  const plotWidth = chartWidth - LEFT - RIGHT;
  const plotBottom = CHART_HEIGHT - BOTTOM;
  const plotHeight = plotBottom - TOP;
  const maxAge = Math.max(14, ...data.map((point) => point.ageDays));
  const xMax = Math.ceil(maxAge / 7) * 7;
  const tickStep = xMax <= 42 ? 7 : 14;
  const xTicks = Array.from({ length: Math.floor(xMax / tickStep) + 1 }, (_, index) => index * tickStep);
  if (xTicks[xTicks.length - 1] !== xMax) xTicks.push(xMax);
  const stageIndex = new Map(stages.map((stage, index) => [stage, index]));
  const yForStage = (index: number) =>
    stages.length <= 1 ? TOP + plotHeight / 2 : TOP + (plotHeight / (stages.length - 1)) * index;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="flex w-full flex-col overflow-hidden">
      <div className="flex min-h-6 flex-wrap items-center justify-end gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-brand-accent" />Under 14 days</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-status-warning" />14–29 days</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-status-danger" />30+ days</span>
      </div>
      <svg
        viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
        width={chartWidth}
        height={CHART_HEIGHT}
        className="mx-auto block max-w-full overflow-visible"
        role="img"
        aria-label="Project age by stage"
      >
        {stages.map((stage, index) => {
          const y = yForStage(index);
          return (
            <g key={stage}>
              <line x1={LEFT} x2={chartWidth - RIGHT} y1={y} y2={y} stroke="var(--analytics-border, var(--border))" />
              <line x1={LEFT - 4} x2={LEFT} y1={y} y2={y} stroke="var(--muted-foreground)" />
              <text x={LEFT - 10} y={y + 4} textAnchor="end" fill="var(--muted-foreground)" fontSize="11">
                {stage}
              </text>
            </g>
          );
        })}
        <line x1={LEFT} x2={LEFT} y1={TOP} y2={plotBottom} stroke="var(--muted-foreground)" />
        <line x1={LEFT} x2={chartWidth - RIGHT} y1={plotBottom} y2={plotBottom} stroke="var(--muted-foreground)" />
        {xTicks.map((tick) => {
          const x = LEFT + (tick / xMax) * plotWidth;
          return (
            <g key={tick}>
              <line x1={x} x2={x} y1={TOP} y2={plotBottom} stroke="var(--analytics-border, var(--border))" strokeDasharray="2 4" />
              <line x1={x} x2={x} y1={plotBottom} y2={plotBottom + 5} stroke="var(--muted-foreground)" />
              <text x={x} y={plotBottom + 18} textAnchor="middle" fill="var(--muted-foreground)" fontSize="11">
                {tick}d
              </text>
            </g>
          );
        })}
        {data.map((point, index) => {
          const row = stageIndex.get(point.stage) ?? 0;
          const y = yForStage(row);
          const sameRow = data.slice(0, index).filter((item) => item.stage === point.stage && item.ageDays === point.ageDays).length;
          const jitter = (sameRow % 3 - 1) * 5;
          const x = LEFT + (point.ageDays / xMax) * plotWidth;
          const color = point.ageDays >= 30 ? "var(--status-danger)" : point.ageDays >= 14 ? "var(--status-warning)" : "var(--brand-accent)";
          return (
            <circle key={point.id} cx={x} cy={y + jitter} r="8" fill={color} stroke="var(--background)" strokeWidth="2">
              <title>{`${point.name} · ${point.stage} · ${point.ageDays} days since update`}</title>
            </circle>
          );
        })}
        <text x={chartWidth - RIGHT} y={CHART_HEIGHT - 4} textAnchor="end" fill="var(--muted-foreground)" fontSize="11">{xAxisLabel}</text>
      </svg>
    </div>
  );
}
