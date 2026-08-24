import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "danger";
}) {
  return (
    <div className="crm-kpi-tile flex flex-col items-center gap-1.5 bg-muted/25 p-4 text-center dark:bg-card">
      <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-[28px] leading-none font-semibold tracking-tight",
          tone === "danger" && "text-status-danger"
        )}
      >
        {value}
      </span>
      {hint && <span className="text-[12px] font-medium leading-4 text-muted-foreground">{hint}</span>}
    </div>
  );
}
