"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, RefreshCw, Sparkles } from "lucide-react";
import {
  averageTurnaroundByPackage,
  invoicesByStatus,
  outstandingInvoicesTotal,
  overallAverageTurnaroundDays,
  overdueInvoicesTotal,
  projectsByStage,
  revenueByPackage,
  revenueOverTime,
  totalPaidRevenue,
} from "@/lib/analytics";
import { fetchJson } from "@/lib/fetch-json";
import { formatCurrency } from "@/lib/format";
import { INVOICE_STATUS_TONE, PROJECT_STATUS_TONE } from "@/lib/status";
import { StatTile } from "@/components/dashboard/stat-tile";
import { RevenueOverTimeChart } from "@/components/dashboard/charts/revenue-over-time-chart";
import { RevenueByPackageChart } from "@/components/dashboard/charts/revenue-by-package-chart";
import { TurnaroundChart } from "@/components/dashboard/charts/turnaround-chart";
import { ProjectAgingScatterChart } from "@/components/dashboard/charts/project-aging-scatter-chart";
import { ReceivablesHeatmap } from "@/components/dashboard/charts/receivables-heatmap";
import { Button } from "@/components/ui/button";
import type { Invoice, ManagedPackage, Project } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import type { EntityChangedEvent } from "@/lib/realtime-notification-store";

export default function AnalyticsPage() {
  const { t } = useLocale();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [packages, setPackages] = useState<ManagedPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  const loadAnalytics = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const [invoiceData, projectData, packageData] = await Promise.all([
        fetchJson<Invoice[]>("/api/invoices", "We couldn't load the invoices.", signal),
        fetchJson<Project[]>("/api/projects", "We couldn't load the projects.", signal),
        fetchJson<ManagedPackage[]>("/api/packages", "We couldn't load the packages.", signal),
      ]);

      if (!Array.isArray(invoiceData) || !Array.isArray(projectData) || !Array.isArray(packageData)) {
        throw new Error("The server returned an unexpected analytics response.");
      }

      if (!signal?.aborted) {
        setInvoices(invoiceData);
        setProjects(projectData);
        setPackages(packageData);
      }
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
      if (!signal?.aborted) {
        setError(caughtError instanceof Error ? caughtError.message : "We couldn't load analytics.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadAnalytics(controller.signal));
    return () => controller.abort();
  }, [loadAnalytics]);

  useEffect(() => {
    const handleEntityChanged = (event: Event) => {
      const detail = (event as CustomEvent<EntityChangedEvent>).detail;
      if (detail?.entity === "invoice" || detail?.entity === "project") void loadAnalytics();
    };
    window.addEventListener("clientflow:entity-changed", handleEntityChanged);
    return () => window.removeEventListener("clientflow:entity-changed", handleEntityChanged);
  }, [loadAnalytics]);

  async function generateInsight() {
    setIsGeneratingInsight(true);
    setInsightError(null);

    try {
      const result = await fetchJson<{ insight: string }>(
        "/api/analytics/insight",
        "We couldn't generate an insight right now.",
        undefined,
        { method: "POST" },
      );
      if (typeof result.insight !== "string" || !result.insight.trim()) {
        throw new Error("We couldn't generate an insight right now.");
      }
      setInsight(result.insight.trim());
    } catch (caughtError) {
      setInsightError(
        caughtError instanceof Error ? caughtError.message : "We couldn't generate an insight right now.",
      );
    } finally {
      setIsGeneratingInsight(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-56 items-center justify-center border border-border">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin text-brand-accent" />
          {t("common.loading")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center border border-status-danger/30 px-6 text-center">
        <p className="text-[13px] font-medium text-status-danger">{t("dashboard.analyticsLoadFailed")}</p>
        <p className="mt-1 max-w-sm text-[12px] text-muted-foreground">{error}</p>
        <Button className="mt-4" variant="outline" size="sm" onClick={() => void loadAnalytics()}>
          <RefreshCw />
          {t("common.tryAgain")}
        </Button>
      </div>
    );
  }

  const revenueTrend = revenueOverTime(invoices, 12);
  const revenueByPkg = revenueByPackage(invoices, projects, packages);
  const turnaroundByPkg = averageTurnaroundByPackage(projects, packages).filter(
    (t): t is typeof t & { avgDays: number } => t.avgDays !== null
  );
  const overallTurnaround = overallAverageTurnaroundDays(projects);
  const invoiceStatusRows = invoicesByStatus(invoices);
  const stageRows = projectsByStage(projects);
  const maxStageCount = Math.max(1, ...stageRows.map((s) => s.count));
  const activeProjects = projects.filter((project) => !["LAUNCHED", "CANCELLED"].includes(project.status));
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const agingPoints = activeProjects.map((project) => ({
    id: project.id,
    name: project.name,
    stage: t(`status.project.${project.status}`),
    ageDays: Math.max(0, Math.floor((todayStart - new Date(project.updatedAt).getTime()) / 86_400_000)),
    updatedAt: project.updatedAt,
  }));
  const agingStages = ["PENDING", "DISCOVERY", "DESIGN", "DEVELOPMENT", "REVIEW", "ON_HOLD"]
    .filter((status) => activeProjects.some((project) => project.status === status))
    .map((status) => t(`status.project.${status}`));
  const receivableInvoices = invoices.filter((invoice) => ["SENT", "PAYMENT_PENDING", "FAILED"].includes(invoice.status) && invoice.dueDate);
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));
  const dueByDay = new Map<string, Invoice[]>();
  for (const invoice of receivableInvoices) {
    const key = (invoice.dueDate as string).slice(0, 10);
    dueByDay.set(key, [...(dueByDay.get(key) ?? []), invoice]);
  }
  const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const weekStart = new Date(todayStart);
  const dayOfWeek = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() + (dayOfWeek === 0 ? -6 : 1 - dayOfWeek));
  const receivableDays = Array.from({ length: 140 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const dateKey = localDateKey(date);
    const invoicesForDay = dueByDay.get(dateKey) ?? [];
    return {
      date: dateKey,
      amountCents: invoicesForDay.reduce((total, invoice) => total + invoice.amountCents, 0),
      overdue: date.getTime() < todayStart,
      isToday: date.getTime() === todayStart,
      invoices: invoicesForDay.map((invoice) => ({
        id: invoice.id,
        projectId: invoice.projectId,
        projectName: projectNames.get(invoice.projectId) ?? "Project",
        label: invoice.label,
        amountCents: invoice.amountCents,
        statusLabel: t(`status.invoice.${invoice.status}`),
      })),
    };
  });

  return (
    <div className="analytics-page flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t("dashboard.totalRevenue")} value={formatCurrency(totalPaidRevenue(invoices))} hint={t("dashboard.kpiRevenueHint")} />
        <StatTile
          label={t("dashboard.outstanding")}
          value={formatCurrency(outstandingInvoicesTotal(invoices))}
          hint={t("dashboard.kpiOutstandingHint")}
        />
        <StatTile
          label={t("dashboard.overdue")}
          value={formatCurrency(overdueInvoicesTotal(invoices))}
          tone="danger"
          hint={t("dashboard.kpiOverdueHint")}
        />
        <StatTile
          label={t("dashboard.avgTurnaround")}
          value={overallTurnaround === null ? "—" : `${overallTurnaround}d`}
          hint={t("dashboard.kpiTurnaroundHint")}
        />
      </div>

      <div className="rounded-lg border border-[color:var(--analytics-border)] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-brand-accent" />
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-medium">{t("dashboard.aiInsight")}</h2>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {t("dashboard.aiInsightIntro")}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void generateInsight()}
            disabled={isGeneratingInsight}
            className="shrink-0"
          >
            {isGeneratingInsight ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
            {isGeneratingInsight ? t("dashboard.generating") : t("dashboard.generateInsight")}
          </Button>
        </div>
        {insight && <p className="mt-4 w-full text-[13px] leading-5 text-foreground">{insight}</p>}
        {insightError && <p className="mt-4 w-full text-[13px] text-status-danger">{insightError}</p>}
      </div>

      <div className="rounded-lg border border-[color:var(--analytics-border)] p-5">
        <h2 className="text-[15px] font-medium">{t("dashboard.revenueOverTime")}</h2>
        <p className="text-[12px] text-muted-foreground">{t("dashboard.lastMonthsPaid", { months: 12 })}</p>
        <div className="mt-4">
          <RevenueOverTimeChart data={revenueTrend} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-[color:var(--analytics-border)] p-5">
          <h2 className="text-[15px] font-medium">{t("dashboard.revenueByPackage")}</h2>
          <p className="text-[12px] text-muted-foreground">{t("dashboard.allTimePaid")}</p>
          <div className="mt-4">
            <RevenueByPackageChart data={revenueByPkg} />
          </div>
        </div>

        <div className="rounded-lg border border-[color:var(--analytics-border)] p-5">
          <h2 className="text-[15px] font-medium">{t("dashboard.turnaroundByPackage")}</h2>
          <p className="text-[12px] text-muted-foreground">{t("dashboard.daysFromCreation")}</p>
          <div className="mt-4">
            {turnaroundByPkg.length === 0 ? (
              <p className="py-16 text-center text-[13px] text-muted-foreground">
                {t("dashboard.noLaunches")}
              </p>
            ) : (
              <TurnaroundChart data={turnaroundByPkg} />
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-[color:var(--analytics-border)] p-5">
          <h2 className="text-[15px] font-medium">{t("dashboard.projectAging")}</h2>
          <p className="text-[12px] text-muted-foreground">{t("dashboard.projectAgingIntro")}</p>
          <div className="mt-5">
            <ProjectAgingScatterChart data={agingPoints} stages={agingStages} xAxisLabel={t("dashboard.daysSinceUpdate")} />
          </div>
        </div>

        <div className="rounded-lg border border-[color:var(--analytics-border)] p-5">
          <h2 className="text-[15px] font-medium">{t("dashboard.upcomingReceivables")}</h2>
          <p className="text-[12px] text-muted-foreground">{t("dashboard.upcomingReceivablesIntro")}</p>
          <div className="mt-5">
            <ReceivablesHeatmap data={receivableDays} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex h-full flex-col rounded-lg border border-[color:var(--analytics-border)] p-5">
          <h2 className="text-[15px] font-medium">{t("dashboard.pipelineByStage")}</h2>
          <p className="text-[12px] text-muted-foreground">{t("dashboard.everyProjectCurrentStage")}</p>
          <div className="mt-4 flex flex-1 flex-col justify-between gap-3">
            {stageRows.map((s) => (
              <div key={s.status} className="flex items-center gap-3 text-[13px]">
                <span className={`w-24 shrink-0 ${PROJECT_STATUS_TONE[s.status]}`}>
                  {t(`status.project.${s.status}`)}
                </span>
                <div className="h-2 flex-1 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-brand-accent"
                    style={{ width: `${(s.count / maxStageCount) * 100}%` }}
                  />
                </div>
                <span className="w-5 shrink-0 text-right tabular-nums text-muted-foreground">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[color:var(--analytics-border)] p-5">
          <h2 className="text-[15px] font-medium">{t("dashboard.invoicesByStatus")}</h2>
          <p className="text-[12px] text-muted-foreground">{t("dashboard.countAndTotal")}</p>
          <table className="analytics-status-table mt-4 w-full text-[13px]">
            <thead>
              <tr className="border-b border-[color:var(--analytics-border)] text-left text-[12px] text-muted-foreground">
                <th className="py-2 font-normal">{t("common.status")}</th>
                <th className="py-2 text-right font-normal">{t("common.count")}</th>
                <th className="py-2 text-right font-normal">{t("common.amount")}</th>
              </tr>
            </thead>
            <tbody>
              {invoiceStatusRows.map((row) => (
                <tr key={row.status} className="border-b border-[color:var(--analytics-border)] last:border-0">
                  <td className="py-2">
                    <span className={INVOICE_STATUS_TONE[row.status]}>{t(`status.invoice.${row.status}`)}</span>
                  </td>
                  <td className="py-2 text-right tabular-nums text-muted-foreground">{row.count}</td>
                  <td className="py-2 text-right tabular-nums">{formatCurrency(row.amountCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
