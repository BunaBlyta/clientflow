"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";

const chartConfig = {
  revenueCents: {
    label: "Revenue",
    color: "var(--brand-accent)",
  },
} satisfies ChartConfig;

export function RevenueOverTimeChart({
  data,
}: {
  data: { label: string; revenueCents: number }[];
}) {
  const averageRevenue = data.length
    ? data.reduce((total, entry) => total + entry.revenueCents, 0) / data.length
    : 0;

  return (
    <ChartContainer config={chartConfig} className="h-56 w-full">
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-accent)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--brand-accent)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
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
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
          stroke="var(--muted-foreground)"
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatCurrency(value as number)}
              indicator="line"
            />
          }
        />
        <Area
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
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            label={{ value: "Average", position: "insideTopRight", fill: "var(--muted-foreground)", fontSize: 11 }}
          />
        )}
      </AreaChart>
    </ChartContainer>
  );
}
