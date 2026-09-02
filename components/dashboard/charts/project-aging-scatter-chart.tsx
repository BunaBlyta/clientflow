"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/format";
import { useLocale } from "@/lib/i18n";

type ProjectAgingPoint = {
  id: string;
  name: string;
  stage: string;
  ageDays: number;
  updatedAt: string;
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
  const { locale } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const chartWidth = Math.max((containerWidth || DEFAULT_WIDTH) - 8, LEFT + RIGHT + 1);
  const plotWidth = chartWidth - LEFT - RIGHT;
  const plotBottom = CHART_HEIGHT - BOTTOM;
  const plotHeight = plotBottom - TOP;
  const maxAge = Math.max(14, ...data.map((point) => point.ageDays));
  const xMax = Math.ceil(maxAge / 7) * 7;
  const tickStep = xMax <= 42 ? 7 : 14;
  const xTicks = Array.from({ length: Math.floor(xMax / tickStep) + 1 }, (_, index) => index * tickStep);
  if (xTicks[xTicks.length - 1] !== xMax) xTicks.push(xMax);
  const selectedPoint = data.find((point) => point.id === selectedPointId) ?? null;
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
    <div ref={containerRef} className="analytics-chart-canvas flex w-full flex-col overflow-hidden">
      <svg
        viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
        width={chartWidth}
        height={CHART_HEIGHT}
        className="relative top-5 mx-0 block max-w-full overflow-visible"
        role="img"
        aria-label="Project age by stage"
      >
        {stages.map((stage, index) => {
          const y = yForStage(index);
          return (
            <g key={stage}>
              <line className="analytics-gridline" x1={0} x2={chartWidth} y1={y} y2={y} stroke="var(--analytics-border, var(--border))" />
              <line x1={LEFT - 4} x2={LEFT} y1={y} y2={y} stroke="var(--muted-foreground)" />
              <text x={LEFT - 10} y={y + 4} textAnchor="end" fill="var(--muted-foreground)" fontSize="11">
                {stage}
              </text>
            </g>
          );
        })}
        <line x1={LEFT} x2={LEFT} y1={TOP - 35} y2={plotBottom} stroke="var(--muted-foreground)" />
        <line x1={LEFT} x2={chartWidth - RIGHT} y1={plotBottom} y2={plotBottom} stroke="var(--muted-foreground)" />
        {xTicks.map((tick) => {
          const x = LEFT + (tick / xMax) * plotWidth;
          return (
            <g key={tick}>
              <line className="analytics-gridline-v" x1={x} x2={x} y1={0} y2={CHART_HEIGHT} stroke="var(--analytics-border, var(--border))" strokeDasharray="2 4" />
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
            <g
              key={point.id}
              role="button"
              tabIndex={0}
              aria-pressed={selectedPointId === point.id}
              aria-label={`${point.name}, ${point.stage}, ${point.ageDays} days since update`}
              onClick={() => setSelectedPointId((current) => current === point.id ? null : point.id)}
              onDoubleClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setSelectedPointId(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedPointId((current) => current === point.id ? null : point.id);
                }
              }}
              className="cursor-pointer outline-none"
            >
              <circle cx={x} cy={y + jitter} r="14" fill="transparent" />
              <circle
                cx={x}
                cy={y + jitter}
                r="8"
                fill={color}
                stroke={selectedPointId === point.id ? "var(--foreground)" : "var(--background)"}
                strokeWidth={selectedPointId === point.id ? 3 : 2}
              >
                <title>{`${point.name} · ${point.stage} · ${point.ageDays} days since update`}</title>
              </circle>
            </g>
          );
        })}
        <text x={chartWidth - RIGHT - 22} y={CHART_HEIGHT - 25} textAnchor="end" fill="var(--muted-foreground)" fontSize="11">{xAxisLabel}</text>
      </svg>
      {selectedPoint && (
        <div className="mt-2 flex items-center justify-between gap-4 px-5 pt-3 text-[12px]">
          <Link
            href={`/dashboard/projects/${selectedPoint.id}`}
            className="min-w-0 flex-1 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60"
          >
            <p className="truncate font-medium">{selectedPoint.name}</p>
            <p className="mt-0.5 text-muted-foreground">
              {selectedPoint.stage} · {selectedPoint.ageDays} days since update
            </p>
            <p className="mt-1 text-muted-foreground">Updated {formatDate(selectedPoint.updatedAt, locale)}</p>
          </Link>
          <div className="flex shrink-0 items-center gap-3">
            <button type="button" onClick={() => setSelectedPointId(null)} className="flex items-center gap-1 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground" aria-label="Clear selection">
              Clear <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
