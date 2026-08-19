"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";

type GridLineProps = {
  y1: number;
  y2: number;
  stroke?: string;
  strokeDasharray?: string | number;
  strokeWidth?: string | number;
  opacity?: number | string;
};

type RevenueChartEntry = {
  label: string;
  revenueCents: number | null;
  comparisonRevenueCents?: number | null;
  comparisonLabel?: string;
};

type RevenueTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: RevenueChartEntry }>;
  currentLabel: string;
  comparisonLabel: string;
};

function RevenueTooltip({ active, payload, currentLabel, comparisonLabel }: RevenueTooltipProps) {
  const entry = payload?.[0]?.payload;
  if (!active || !entry) return null;

  return (
    <div className="min-w-40 rounded-md border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="mb-2 font-medium text-foreground">{entry.label}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-full bg-brand-accent" />
          {currentLabel}
        </span>
        <span className="font-medium tabular-nums">{typeof entry.revenueCents === "number" ? formatCurrency(entry.revenueCents) : "—"}</span>
      </div>
      {entry.comparisonLabel && (
        <div className="mt-1.5 flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-0 w-3 border-t-2 border-dashed border-muted-foreground" />
            {comparisonLabel}
          </span>
          <span className="font-medium tabular-nums">{typeof entry.comparisonRevenueCents === "number" ? formatCurrency(entry.comparisonRevenueCents) : "—"}</span>
        </div>
      )}
    </div>
  );
}

function extendHorizontalGridLine({ y1, y2, stroke, strokeDasharray, strokeWidth, opacity }: GridLineProps) {
  return (
    <line
      className="analytics-gridline"
      x1={0}
      x2={10000}
      y1={y1}
      y2={y2}
      stroke={stroke}
      strokeDasharray={strokeDasharray}
      strokeWidth={strokeWidth}
      opacity={opacity}
    />
  );
}

export function RevenueOverTimeChart({
  data,
  currentLabel = "Current period",
  comparisonLabel = "Comparison period",
  averageLabel = "Average",
}: {
  data: RevenueChartEntry[];
  currentLabel?: string;
  comparisonLabel?: string;
  averageLabel?: string;
}) {
  const chartConfig = {
    revenueCents: {
      label: currentLabel,
      color: "var(--brand-accent)",
    },
    comparisonRevenueCents: {
      label: comparisonLabel,
      color: "var(--muted-foreground)",
    },
  } satisfies ChartConfig;
  const currentValues = data.flatMap((entry) => (typeof entry.revenueCents === "number" ? [entry.revenueCents] : []));
  const averageRevenue = currentValues.length
    ? currentValues.reduce((total, value) => total + value, 0) / currentValues.length
    : 0;
  const hasComparison = data.some((entry) => typeof entry.comparisonRevenueCents === "number");

  return (
    <ChartContainer config={chartConfig} className="analytics-chart-canvas h-56 w-full">
      <AreaChart data={data} margin={{ left: 20, right: 8, top: 12, bottom: hasComparison ? 8 : 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-accent)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--brand-accent)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          horizontal={extendHorizontalGridLine}
          vertical={false}
          stroke="var(--analytics-border, var(--border))"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={52}
          fontSize={11}
          stroke="var(--muted-foreground)"
          tickFormatter={(value) => formatCurrency(Number(value)).replace(/\.00$/, "")}
        />
        <XAxis
          xAxisId="current"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={hasComparison ? 4 : 8}
          fontSize={12}
          stroke="var(--muted-foreground)"
        />
        {hasComparison && (
          <XAxis
            xAxisId="comparison"
            dataKey="comparisonLabel"
            orientation="bottom"
            height={24}
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            fontSize={11}
            stroke="var(--muted-foreground)"
            tickFormatter={(value) => typeof value === "string" ? value : ""}
          />
        )}
        <ChartTooltip
          content={<RevenueTooltip currentLabel={currentLabel} comparisonLabel={comparisonLabel} />}
        />
        <Area
          xAxisId="current"
          dataKey="revenueCents"
          type="monotone"
          stroke="var(--brand-accent)"
          strokeWidth={2}
          fill="url(#revenueFill)"
          dot={{ r: 3, fill: "var(--brand-accent)", strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--background)" }}
        />
        {averageRevenue > 0 && (
          <ReferenceLine
            y={averageRevenue}
            stroke="var(--foreground)"
            strokeOpacity={0.42}
            strokeDasharray="3 5"
            label={{ value: averageLabel, position: "insideTopRight", fill: "var(--foreground)", fillOpacity: 0.58, fontSize: 11 }}
          />
        )}
        {hasComparison && (
          <Area
            xAxisId="comparison"
            dataKey="comparisonRevenueCents"
            type="monotone"
            stroke="var(--muted-foreground)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            fill="none"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--background)" }}
            connectNulls={false}
          />
        )}
      </AreaChart>
    </ChartContainer>
  );
}
