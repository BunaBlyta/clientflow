import { AlertCircle } from "lucide-react";

export function FieldHint({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <div
      id={id}
      role="alert"
      className="crm-field-hint flex min-w-0 max-w-[68%] shrink items-center gap-1.5 overflow-hidden whitespace-nowrap text-[12px] leading-4 text-status-danger"
    >
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 overflow-hidden text-ellipsis">{message}</span>
    </div>
  );
}
