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
    <div className="flex flex-col gap-1.5 rounded-lg border border-border p-4">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-[28px] leading-none font-semibold tracking-tight",
          tone === "danger" && "text-status-danger"
        )}
      >
        {value}
      </span>
      {hint && <span className="text-[12px] leading-4 text-muted-foreground">{hint}</span>}
    </div>
  );
}
