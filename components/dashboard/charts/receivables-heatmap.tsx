import { formatCurrency, formatDate } from "@/lib/format";

type ReceivableDay = {
  date: string;
  amountCents: number;
  overdue: boolean;
  isToday: boolean;
};

function heatColor(amountCents: number, maxAmount: number, overdue: boolean) {
  if (amountCents === 0) return "var(--muted)";
  const opacity = Math.max(0.25, amountCents / maxAmount);
  return overdue
    ? `color-mix(in srgb, var(--status-danger) ${Math.round(opacity * 100)}%, transparent)`
    : `color-mix(in srgb, var(--brand-accent) ${Math.round(opacity * 100)}%, transparent)`;
}

export function ReceivablesHeatmap({ data }: { data: ReceivableDay[] }) {
  const maxAmount = Math.max(1, ...data.map((day) => day.amountCents));
  const weekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="flex h-72 flex-col">
      <div className="mb-2 flex min-h-6 flex-wrap items-center justify-end gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-status-danger" />Overdue</span>
        <span className="flex items-center gap-1.5">
          <span>Less due</span>
          <span className="size-2.5 rounded-sm bg-muted" />
          <span className="size-2.5 rounded-sm bg-brand-accent/50" />
          <span className="size-2.5 rounded-sm bg-brand-accent" />
          <span>More due</span>
        </span>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-1.5 pl-7 text-center text-[11px] text-muted-foreground">
        {weekdayLabels.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-5 gap-1.5">
        {data.map((day) => (
          <div
            key={day.date}
            title={`${formatDate(day.date)}${day.amountCents ? ` · ${formatCurrency(day.amountCents)}` : ""}`}
            className={`relative flex min-h-0 items-center justify-center rounded-sm border text-[10px] ${day.isToday ? "border-brand-accent" : "border-transparent"} ${day.amountCents ? "text-foreground" : "text-muted-foreground/70"}`}
            style={{ backgroundColor: heatColor(day.amountCents, maxAmount, day.overdue) }}
          >
            {new Date(`${day.date}T12:00:00`).getDate()}
          </div>
        ))}
      </div>
    </div>
  );
}
