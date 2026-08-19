"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";

type ReceivableInvoice = {
  id: string;
  projectId: string;
  projectName: string;
  label: string;
  amountCents: number;
  statusLabel: string;
};

type ReceivableDay = {
  date: string;
  amountCents: number;
  overdue: boolean;
  isToday: boolean;
  invoices: ReceivableInvoice[];
};

function heatColor(amountCents: number, maxAmount: number, overdue: boolean) {
  if (amountCents === 0) return "var(--muted)";
  const opacity = Math.max(0.25, amountCents / maxAmount);
  return overdue
    ? `color-mix(in srgb, var(--status-danger) ${Math.round(opacity * 100)}%, transparent)`
    : `color-mix(in srgb, var(--brand-accent) ${Math.round(opacity * 100)}%, transparent)`;
}

export function ReceivablesHeatmap({ data }: { data: ReceivableDay[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleWeeks, setVisibleWeeks] = useState(8);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const maxAmount = Math.max(1, ...data.map((day) => day.amountCents));
  const weekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  const visibleWeekStarts = Array.from({ length: visibleWeeks }, (_, index) => data[index * 7]);
  const monthLabels = visibleWeekStarts.map((week, index) => {
    if (!week) return "";
    const date = new Date(`${week.date}T12:00:00`);
    const previousWeek = visibleWeekStarts[index - 1];
    const previousDate = previousWeek ? new Date(`${previousWeek.date}T12:00:00`) : null;
    return index === 0 || date.getMonth() !== previousDate?.getMonth()
      ? date.toLocaleDateString("en-US", { month: "short" })
      : "";
  });
  const selectedDay = data.find((day) => day.date === selectedDate) ?? null;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const availableWidth = Math.max(0, entry.contentRect.width - 36);
      const weeksThatFit = Math.floor((availableWidth + 6) / 34);
      setVisibleWeeks(Math.max(5, Math.min(weeksThatFit, Math.floor(data.length / 7))));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [data.length]);

  return (
    <div className="relative -top-3 flex flex-col">
      <div ref={containerRef} className="flex h-[300px] flex-col pt-8">
      <div className="mb-1 flex gap-2 text-[10px] text-muted-foreground">
        <span className="w-5 shrink-0" />
        <div
          className="grid min-w-0 flex-1 gap-1.5"
          style={{ gridTemplateColumns: `repeat(${visibleWeeks}, minmax(0, 1fr))` }}
        >
          {monthLabels.map((label, index) => <span key={`${label}-${index}`} className="truncate">{label}</span>)}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 gap-2 overflow-hidden">
        <div className="grid h-full grid-rows-7 gap-1.5 text-[10px] text-muted-foreground">
          {weekdayLabels.map((label, index) => <span key={`${label}-${index}`} className="flex w-5 items-center justify-center">{label}</span>)}
        </div>
        <div
          className="grid min-w-0 flex-1 grid-flow-col grid-rows-7 gap-1.5 overflow-hidden"
          style={{ gridTemplateColumns: `repeat(${visibleWeeks}, minmax(0, 1fr))` }}
        >
        {data.slice(0, visibleWeeks * 7).map((day) => (
          <button
            type="button"
            key={day.date}
            title={`${formatDate(day.date)}${day.amountCents ? ` · ${formatCurrency(day.amountCents)}` : ""}`}
            aria-label={`${formatDate(day.date)}${day.amountCents ? `, ${formatCurrency(day.amountCents)} due` : ", no receivables due"}`}
            aria-pressed={selectedDate === day.date}
            onClick={() => setSelectedDate(day.date)}
            onDoubleClick={() => setSelectedDate(null)}
            className={`relative flex size-full cursor-pointer items-center justify-center rounded-sm border text-[10px] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-brand-accent ${day.isToday || selectedDate === day.date ? "border-brand-accent" : "border-transparent"} ${day.amountCents ? "text-foreground" : "text-muted-foreground/70"}`}
            style={{ backgroundColor: heatColor(day.amountCents, maxAmount, day.overdue) }}
          >
            {new Date(`${day.date}T12:00:00`).getDate()}
          </button>
        ))}
        </div>
      </div>
      </div>
      {selectedDay && (
        <div className="mt-2 border-t border-[color:var(--analytics-border)] pt-4 text-[12px]">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {formatDate(selectedDay.date)}
                <span className="ml-2 font-normal text-muted-foreground">{formatCurrency(selectedDay.amountCents)} due</span>
              </p>
              {selectedDay.overdue && <span className="ml-2 font-normal text-status-danger">Overdue</span>}
              {selectedDay.invoices.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  {selectedDay.invoices.map((invoice) => (
                    <Link
                      key={invoice.id}
                      href={`/dashboard/projects/${invoice.projectId}`}
                      className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/60"
                    >
                      <span className="min-w-0 truncate">
                        <span className="font-medium">{invoice.projectName}</span>
                        <span className="ml-2 text-muted-foreground">{invoice.label} · {invoice.statusLabel}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => setSelectedDate(null)} className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground" aria-label="Clear selection">
              Clear <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
