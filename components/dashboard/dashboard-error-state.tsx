"use client";

import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";

export function DashboardErrorState({
  title,
  error,
  onRetry,
  backLink,
  className = "min-h-40",
}: {
  title: string;
  error: string;
  onRetry: () => void;
  backLink?: ReactNode;
  className?: string;
}) {
  const { t } = useLocale();
  return (
    <div className={`flex flex-col gap-6 ${backLink ? "" : className}`}>
      {backLink}
      <div className={`flex ${className} flex-col items-center justify-center border border-status-danger/30 px-6 text-center`}>
        <p className="text-[13px] font-medium text-status-danger">{title}</p>
        <p className="mt-1 max-w-sm text-[12px] text-muted-foreground">{error}</p>
        <Button className="mt-4" variant="outline" size="sm" onClick={onRetry}><RefreshCw />{t("common.tryAgainShort")}</Button>
      </div>
    </div>
  );
}
