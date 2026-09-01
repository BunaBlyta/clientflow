import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

export function SortableTableHeader({
  label,
  active,
  direction,
  onClick,
  className = "",
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
  className?: string;
}) {
  return (
    <th className={className}>
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 font-normal hover:text-foreground">
        {label}
        {active ? (direction === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ChevronsUpDown className="size-3 opacity-50" />}
      </button>
    </th>
  );
}
