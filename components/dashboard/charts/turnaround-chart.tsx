"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  avgDays: {
    label: "Avg. turnaround",
    color: "var(--brand-accent)",
  },
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

export function TurnaroundChart({
  data,
}: {
  data: { name: string; avgDays: number }[];
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
          content={<ChartTooltipContent formatter={(value) => `${value} days`} />}
        />
        <Bar dataKey="avgDays" radius={[4, 4, 0, 0]} maxBarSize={72} fill="var(--brand-accent)">
          <LabelList
            dataKey="avgDays"
            position="top"
            formatter={(value) => (typeof value === "number" ? `${value}d` : "")}
            fontSize={12}
            fill="var(--foreground)"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
