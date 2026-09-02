"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, RefreshCw, Sparkles } from "lucide-react";
import {
  averageTurnaroundByPackage,
  invoicesByStatus,
  outstandingInvoicesTotal,
  overallAverageTurnaroundDays,
  overdueInvoicesTotal,
  projectsByStage,
  revenueByPackage,
  revenueOverTimeRange,
  totalPaidRevenue,
  type RevenueDateRange,
} from "@/lib/analytics";
import { fetchJson } from "@/lib/fetch-json";
import { fetchDashboardData, invalidateDashboardData } from "@/lib/dashboard-data-cache";
import { formatCurrency } from "@/lib/format";
import { INVOICE_STATUS_TONE, PROJECT_STATUS_TONE } from "@/lib/status";
import { StatTile } from "@/components/dashboard/stat-tile";
import { RevenueOverTimeChart } from "@/components/dashboard/charts/revenue-over-time-chart";
import { RevenueByPackageChart } from "@/components/dashboard/charts/revenue-by-package-chart";
import { TurnaroundChart } from "@/components/dashboard/charts/turnaround-chart";
import { ProjectAgingScatterChart } from "@/components/dashboard/charts/project-aging-scatter-chart";
import { ReceivablesHeatmap } from "@/components/dashboard/charts/receivables-heatmap";
import { AnalyticsGridOverlay } from "@/components/dashboard/charts/analytics-grid-overlay";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/dashboard/date-picker";
import type { Invoice, ManagedPackage, Project } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import type { EntityChangedEvent } from "@/lib/realtime-notification-store";
import { upsertById } from "@/lib/upsert-by-id";

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function defaultRevenueRange(): RevenueDateRange {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - 11, 1);
  return { start: toDateInputValue(start), end: toDateInputValue(end) };
}

export default function AnalyticsPage() {
  const { t, locale } = useLocale();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [packages, setPackages] = useState<ManagedPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [revenueView, setRevenueView] = useState<"single" | "compare">("single");
  const [revenueRange, setRevenueRange] = useState<RevenueDateRange>(defaultRevenueRange);
  const [comparisonRange, setComparisonRange] = useState<RevenueDateRange>(defaultRevenueRange);
  const pipelineCardRef = useRef<HTMLDivElement>(null);
  const invoiceStatusCardRef = useRef<HTMLDivElement>(null);

  const loadAnalytics = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const [invoiceData, projectData, packageData] = await Promise.all([
        fetchDashboardData<Invoice[]>("/api/invoices", "We couldn't load the invoices."),
        fetchDashboardData<Project[]>("/api/projects", "We couldn't load the projects."),
        fetchDashboardData<ManagedPackage[]>("/api/packages", "We couldn't load the packages."),
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
      if (detail?.entity === "invoice") {
        invalidateDashboardData("/api/invoices");
        void fetchJson<Invoice>(
          `/api/invoices/${encodeURIComponent(detail.id)}`,
          "We couldn't refresh this invoice.",
        )
          .then((invoice) => setInvoices((current) => upsertById(current, invoice)))
          .catch(() => undefined);
      } else if (detail?.entity === "project") {
        invalidateDashboardData("/api/projects");
        void fetchJson<Project>(
          `/api/projects/${encodeURIComponent(detail.id)}`,
          "We couldn't refresh this project.",
        )
          .then((project) => setProjects((current) => upsertById(current, project)))
          .catch(() => undefined);
      }
    };
    window.addEventListener("clientflow:entity-changed", handleEntityChanged);
    return () => window.removeEventListener("clientflow:entity-changed", handleEntityChanged);
  }, []);

  useEffect(() => {
    const pipelineCard = pipelineCardRef.current;
    const invoiceStatusCard = invoiceStatusCardRef.current;
    if (!pipelineCard || !invoiceStatusCard) return;

    const syncPipelineHeight = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        pipelineCard.style.minHeight = `${Math.ceil(invoiceStatusCard.getBoundingClientRect().height)}px`;
      } else {
        pipelineCard.style.minHeight = "";
      }
    };

    syncPipelineHeight();
    const resizeObserver = new ResizeObserver(syncPipelineHeight);
    resizeObserver.observe(invoiceStatusCard);
    window.addEventListener("resize", syncPipelineHeight);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", syncPipelineHeight);
    };
  }, [isLoading]);

  async function generateInsight() {
    setIsGeneratingInsight(true);
    setInsightError(null);

    try {
      const result = await fetchJson<{ insight: string }>(
        "/api/analytics/insight",
        "We couldn't generate an insight right now.",
        undefined,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale }) },
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

  const revenueTrend = revenueOverTimeRange(invoices, revenueRange, locale);
  const comparisonTrend = revenueView === "compare" ? revenueOverTimeRange(invoices, comparisonRange, locale) : [];
  const comparisonPointCount = Math.max(revenueTrend.length, comparisonTrend.length);
  const revenueChartData = revenueView === "compare"
    ? Array.from({ length: comparisonPointCount }, (_, index) => {
        const currentIndex = revenueTrend.length <= 1
          ? 0
          : Math.round((index * (revenueTrend.length - 1)) / (comparisonPointCount - 1));
        const comparisonIndex = comparisonTrend.length <= 1
          ? 0
          : Math.round((index * (comparisonTrend.length - 1)) / (comparisonPointCount - 1));
        return {
          label: revenueTrend[currentIndex]?.label ?? "",
          revenueCents: revenueTrend[currentIndex]?.revenueCents ?? null,
          comparisonRevenueCents: comparisonTrend[comparisonIndex]?.revenueCents ?? null,
          comparisonLabel: comparisonTrend[comparisonIndex]?.label ?? "",
        };
      })
    : revenueTrend.map((entry) => ({ ...entry, revenueCents: entry.revenueCents }));
  const invalidRevenueRange = revenueRange.start > revenueRange.end;
  const invalidComparisonRange = comparisonRange.start > comparisonRange.end;
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
      <div className="crm-kpi-strip grid overflow-hidden rounded-lg dark:border dark:border-border dark:bg-card sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="analytics-card rounded-lg p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            className="analytics-generate-insight shrink-0 text-foreground hover:text-foreground"
          >
            {isGeneratingInsight ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
            {isGeneratingInsight ? t("dashboard.generating") : t("dashboard.generateInsight")}
          </Button>
        </div>
        {insight && <p className="mt-4 w-full text-[13px] leading-5 text-foreground">{insight}</p>}
        {insightError && <p className="mt-4 w-full text-[13px] text-status-danger">{insightError}</p>}
      </div>

      <div className="analytics-card analytics-chart-card relative overflow-hidden rounded-lg border-0 p-5">
        <AnalyticsGridOverlay dependency={revenueChartData} />
        <div className="relative z-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-[15px] font-medium">{t("dashboard.revenueOverTime")}</h2>
              <p className="text-[12px] text-muted-foreground">{t("dashboard.revenuePeriodIntro")}</p>
            </div>
            <div className="analytics-revenue-controls flex shrink-0 flex-wrap items-start justify-end gap-2">
              <div className="flex items-center gap-2">
                {revenueView === "compare" && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-accent/15 text-[11px] font-medium text-brand-accent">A</span>
                )}
                <div className="flex gap-2">
                  <DatePicker
                    className="w-32"
                    ariaLabel={`${t("dashboard.periodOne")} ${t("dashboard.from")}`}
                    value={revenueRange.start}
                    max={revenueRange.end}
                    onChange={(start) => setRevenueRange((range) => ({ ...range, start }))}
                  />
                  <DatePicker
                    className="w-32"
                    ariaLabel={`${t("dashboard.periodOne")} ${t("dashboard.to")}`}
                    value={revenueRange.end}
                    min={revenueRange.start}
                    onChange={(end) => setRevenueRange((range) => ({ ...range, end }))}
                  />
                </div>
              </div>
              {revenueView === "compare" && (
                <div className="flex items-center gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">B</span>
                  <div className="flex gap-2">
                    <DatePicker
                      className="w-32"
                      ariaLabel={`${t("dashboard.periodTwo")} ${t("dashboard.from")}`}
                      value={comparisonRange.start}
                      max={comparisonRange.end}
                      onChange={(start) => setComparisonRange((range) => ({ ...range, start }))}
                    />
                    <DatePicker
                      className="w-32"
                      ariaLabel={`${t("dashboard.periodTwo")} ${t("dashboard.to")}`}
                      value={comparisonRange.end}
                      min={comparisonRange.start}
                      onChange={(end) => setComparisonRange((range) => ({ ...range, end }))}
                    />
                  </div>
                </div>
              )}
              <Tabs
                value={revenueView}
                onValueChange={(value) => {
                  if (value === "single" || value === "compare") setRevenueView(value);
                }}
                className="analytics-revenue-tab-picker"
              >
                <TabsList>
                  <TabsTrigger value="single">{t("dashboard.singlePeriod")}</TabsTrigger>
                  <TabsTrigger value="compare">{t("dashboard.comparePeriods")}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          {(invalidRevenueRange || (revenueView === "compare" && invalidComparisonRange)) ? (
            <p className="mt-2 text-[12px] text-status-danger">{t("dashboard.invalidRevenueRange")}</p>
          ) : null}
          <div className="mt-4">
            <RevenueOverTimeChart
              key={`${revenueView}-${revenueRange.start}-${revenueRange.end}-${comparisonRange.start}-${comparisonRange.end}`}
              data={revenueChartData}
              currentLabel={t("dashboard.periodOne")}
              comparisonLabel={t("dashboard.periodTwo")}
              averageLabel={t("dashboard.average")}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="analytics-card analytics-chart-card relative overflow-hidden rounded-lg border-0 p-5">
          <AnalyticsGridOverlay dependency={revenueByPkg} />
          <div className="relative z-10">
            <h2 className="text-[15px] font-medium">{t("dashboard.revenueByPackage")}</h2>
            <p className="text-[12px] text-muted-foreground">{t("dashboard.allTimePaid")}</p>
            <div className="mt-4">
              <RevenueByPackageChart data={revenueByPkg} />
            </div>
          </div>
        </div>

        <div className="analytics-card analytics-chart-card relative overflow-hidden rounded-lg border-0 p-5">
          <AnalyticsGridOverlay dependency={turnaroundByPkg} />
          <div className="relative z-10">
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-6">
          <div className="analytics-fixed-card order-1 analytics-card analytics-chart-card relative h-[400px] overflow-hidden rounded-lg border-0 p-5 lg:order-none">
            <AnalyticsGridOverlay dependency={agingPoints} />
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-[15px] font-medium">{t("dashboard.projectAging")}</h2>
                  <p className="text-[12px] text-muted-foreground">{t("dashboard.projectAgingIntro")}</p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-brand-accent" />{t("analytics.under14Days")}</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-status-warning" />{t("analytics.days14to29")}</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-status-danger" />{t("analytics.days30Plus")}</span>
                </div>
              </div>
              <div className="relative -left-1 mt-8">
                <ProjectAgingScatterChart data={agingPoints} stages={agingStages} xAxisLabel={t("dashboard.daysSinceUpdate")} />
              </div>
            </div>
          </div>

          <div ref={pipelineCardRef} className="order-3 analytics-card flex flex-col rounded-lg p-5 lg:order-none">
            <h2 className="text-[15px] font-medium">{t("dashboard.pipelineByStage")}</h2>
            <p className="text-[12px] text-muted-foreground">{t("dashboard.everyProjectCurrentStage")}</p>
            <div className="mt-4 flex flex-1 flex-col justify-between gap-3">
              {stageRows.map((s) => (
                <div key={s.status} className="flex items-center gap-3 text-[13px]">
                  <span className={`w-24 shrink-0 ${PROJECT_STATUS_TONE[s.status]}`}>
                    {t(`status.project.${s.status}`)}
                  </span>
                  <div className="analytics-pipeline-track h-2 flex-1 rounded-full bg-muted">
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
        </div>

        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-6">
          <div className="analytics-fixed-card order-2 analytics-card analytics-chart-card h-[400px] rounded-lg border-0 p-5 lg:order-none">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-[15px] font-medium">{t("dashboard.upcomingReceivables")}</h2>
                <p className="text-[12px] text-muted-foreground">{t("dashboard.upcomingReceivablesIntro")}</p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-x-6 gap-y-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-2 whitespace-nowrap"><span className="size-2.5 rounded-sm bg-status-danger" />{t("dashboard.receivablesOverdue")}</span>
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <span>{t("analytics.lessDue")}</span>
                  <span className="size-2.5 rounded-sm bg-muted" />
                  <span className="size-2.5 rounded-sm bg-brand-accent/50" />
                  <span className="size-2.5 rounded-sm bg-brand-accent" />
                  <span>{t("analytics.moreDue")}</span>
                </span>
              </div>
            </div>
            <div className="mt-2">
              <ReceivablesHeatmap data={receivableDays} />
            </div>
          </div>

          <div ref={invoiceStatusCardRef} className="order-4 analytics-card rounded-lg p-5 lg:order-none">
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
    </div>
  );
}
