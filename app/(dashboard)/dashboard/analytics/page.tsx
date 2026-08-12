"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
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
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE } from "@/lib/status";
import { StatTile } from "@/components/dashboard/stat-tile";
import { RevenueOverTimeChart } from "@/components/dashboard/charts/revenue-over-time-chart";
import { RevenueByPackageChart } from "@/components/dashboard/charts/revenue-by-package-chart";
import { TurnaroundChart } from "@/components/dashboard/charts/turnaround-chart";
import { Button } from "@/components/ui/button";
import type { Invoice, Project } from "@/lib/types";

const PACKAGE_LEGEND_COLORS = ["#2a78d6", "#eb6834", "#1baf7a"];

export default function AnalyticsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const [invoiceData, projectData] = await Promise.all([
        fetchJson<Invoice[]>("/api/invoices", "We couldn't load the invoices.", signal),
        fetchJson<Project[]>("/api/projects", "We couldn't load the projects.", signal),
      ]);

      if (!Array.isArray(invoiceData) || !Array.isArray(projectData)) {
        throw new Error("The server returned an unexpected analytics response.");
      }

      if (!signal?.aborted) {
        setInvoices(invoiceData);
        setProjects(projectData);
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

  if (isLoading) {
    return (
      <div className="flex min-h-56 items-center justify-center border border-border">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin text-brand-accent" />
          Loading analytics…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center border border-status-danger/30 px-6 text-center">
        <p className="text-[13px] font-medium text-status-danger">Analytics couldn&apos;t load</p>
        <p className="mt-1 max-w-sm text-[12px] text-muted-foreground">{error}</p>
        <Button className="mt-4" variant="outline" size="sm" onClick={() => void loadAnalytics()}>
          <RefreshCw />
          Try again
        </Button>
      </div>
    );
  }

  const revenueTrend = revenueOverTime(invoices, 12);
  const revenueByPkg = revenueByPackage(invoices, projects);
  const turnaroundByPkg = averageTurnaroundByPackage(projects).filter(
    (t): t is typeof t & { avgDays: number } => t.avgDays !== null
  );
  const overallTurnaround = overallAverageTurnaroundDays(projects);
  const invoiceStatusRows = invoicesByStatus(invoices);
  const stageRows = projectsByStage(projects);
  const maxStageCount = Math.max(1, ...stageRows.map((s) => s.count));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-[22px]">Analytics</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Revenue, turnaround, and pipeline health across every project and invoice.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total revenue" value={formatCurrency(totalPaidRevenue(invoices))} hint="All-time, paid invoices" />
        <StatTile
          label="Outstanding"
          value={formatCurrency(outstandingInvoicesTotal(invoices))}
          hint="Sent, pending, or failed"
        />
        <StatTile
          label="Overdue"
          value={formatCurrency(overdueInvoicesTotal(invoices))}
          tone="danger"
          hint="Past due date, unpaid"
        />
        <StatTile
          label="Avg. turnaround"
          value={overallTurnaround === null ? "—" : `${overallTurnaround}d`}
          hint="Creation to launch, all packages"
        />
      </div>

      <div className="rounded-lg border border-border p-5">
        <h2 className="text-[15px] font-medium">Revenue over time</h2>
        <p className="text-[12px] text-muted-foreground">Last 12 months, paid invoices</p>
        <div className="mt-4">
          <RevenueOverTimeChart data={revenueTrend} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border p-5">
          <h2 className="text-[15px] font-medium">Revenue by package</h2>
          <p className="text-[12px] text-muted-foreground">All-time, paid invoices</p>
          <div className="mt-4">
            <RevenueByPackageChart data={revenueByPkg} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
            {revenueByPkg.map((pkg, i) => (
              <span key={pkg.packageId} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: PACKAGE_LEGEND_COLORS[i % PACKAGE_LEGEND_COLORS.length] }}
                />
                {pkg.name}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border p-5">
          <h2 className="text-[15px] font-medium">Turnaround by package</h2>
          <p className="text-[12px] text-muted-foreground">Days from creation to launch</p>
          <div className="mt-4">
            {turnaroundByPkg.length === 0 ? (
              <p className="py-16 text-center text-[13px] text-muted-foreground">
                No launched projects yet.
              </p>
            ) : (
              <TurnaroundChart data={turnaroundByPkg} />
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border p-5">
          <h2 className="text-[15px] font-medium">Pipeline by stage</h2>
          <p className="text-[12px] text-muted-foreground">Every project, current stage</p>
          <div className="mt-4 flex flex-col gap-3">
            {stageRows.map((s) => (
              <div key={s.status} className="flex items-center gap-3 text-[13px]">
                <span className={`w-24 shrink-0 ${PROJECT_STATUS_TONE[s.status]}`}>
                  {PROJECT_STATUS_LABEL[s.status]}
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

        <div className="rounded-lg border border-border p-5">
          <h2 className="text-[15px] font-medium">Invoices by status</h2>
          <p className="text-[12px] text-muted-foreground">Count and total, every invoice</p>
          <table className="mt-4 w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
                <th className="py-2 font-normal">Status</th>
                <th className="py-2 text-right font-normal">Count</th>
                <th className="py-2 text-right font-normal">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceStatusRows.map((row) => (
                <tr key={row.status} className="border-b border-border last:border-0">
                  <td className="py-2">
                    <span className={INVOICE_STATUS_TONE[row.status]}>{INVOICE_STATUS_LABEL[row.status]}</span>
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
