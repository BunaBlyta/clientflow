"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";

// Fixed-order categorical triplet (slots 1/2/3 of the validated default palette —
// see the dataviz skill's references/palette.md). Passes CVD + normal-vision
// checks all-pairs; slot 3 (aqua) is below 3:1 on the light surface, so it gets
// a direct value label via <LabelList> rather than relying on color alone.
const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a"];

const chartConfig = {
  revenueCents: { label: "Revenue" },
} satisfies ChartConfig;

type GridLineProps = {
  y1: number;
  y2: number;
  stroke?: string;
  strokeDasharray?: string | number;
  strokeWidth?: string | number;
  opacity?: number | string;
};

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

export function RevenueByPackageChart({
  data,
}: {
  data: { name: string; revenueCents: number }[];
}) {
  return (
    <ChartContainer config={chartConfig} className="analytics-chart-canvas h-56 w-full">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 16, bottom: 0 }}>
        <CartesianGrid
          horizontal={extendHorizontalGridLine}
          vertical={false}
          stroke="var(--analytics-border, var(--border))"
        />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
          stroke="var(--muted-foreground)"
        />
        <ChartTooltip
          content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
        />
        <Bar dataKey="revenueCents" radius={[4, 4, 0, 0]} maxBarSize={72}>
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
          ))}
          <LabelList
            dataKey="revenueCents"
            position="top"
            formatter={(value) => (typeof value === "number" ? formatCurrency(value) : "")}
            fontSize={12}
            fill="var(--foreground)"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
