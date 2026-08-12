"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle, RefreshCw } from "lucide-react";
import {
  activeProjectCount,
  averageTurnaroundByPackage,
  outstandingInvoicesTotal,
  overdueInvoicesTotal,
  revenueByPackage,
  revenueOverTime,
  totalPaidRevenue,
} from "@/lib/analytics";
import { fetchJson } from "@/lib/fetch-json";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatTile } from "@/components/dashboard/stat-tile";
import { RevenueOverTimeChart } from "@/components/dashboard/charts/revenue-over-time-chart";
import { RevenueByPackageChart } from "@/components/dashboard/charts/revenue-by-package-chart";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE } from "@/lib/status";
import { Button } from "@/components/ui/button";
import type { Invoice, Project, ProjectRequest } from "@/lib/types";

const PACKAGE_LEGEND_COLORS = ["#2a78d6", "#eb6834", "#1baf7a"];

export default function OverviewPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectRequests, setProjectRequests] = useState<ProjectRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const [invoiceData, projectData, requestData] = await Promise.all([
        fetchJson<Invoice[]>("/api/invoices", "We couldn't load the invoices.", signal),
        fetchJson<Project[]>("/api/projects", "We couldn't load the projects.", signal),
        fetchJson<ProjectRequest[]>("/api/requests", "We couldn't load project requests.", signal),
      ]);

      if (!Array.isArray(invoiceData) || !Array.isArray(projectData) || !Array.isArray(requestData)) {
        throw new Error("The server returned an unexpected overview response.");
      }

      if (!signal?.aborted) {
        setInvoices(invoiceData);
        setProjects(projectData);
        setProjectRequests(requestData);
      }
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
      if (!signal?.aborted) {
        setError(caughtError instanceof Error ? caughtError.message : "We couldn't load the overview.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadOverview(controller.signal));
    return () => controller.abort();
  }, [loadOverview]);

  if (isLoading) {
    return (
      <div className="flex min-h-56 items-center justify-center border border-border">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin text-brand-accent" />
          Loading overview…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center border border-status-danger/30 px-6 text-center">
        <p className="text-[13px] font-medium text-status-danger">Overview couldn&apos;t load</p>
        <p className="mt-1 max-w-sm text-[12px] text-muted-foreground">{error}</p>
        <Button className="mt-4" variant="outline" size="sm" onClick={() => void loadOverview()}>
          <RefreshCw />
          Try again
        </Button>
      </div>
    );
  }

  const revenueTrend = revenueOverTime(invoices);
  const revenueByPkg = revenueByPackage(invoices, projects);
  const turnaround = averageTurnaroundByPackage(projects);
  const pendingRequests = projectRequests.filter((r) => r.status === "PENDING");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-[22px]">Overview</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          A snapshot of revenue, active work, and what needs your attention.
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
        <StatTile label="Active projects" value={String(activeProjectCount(projects))} hint="Not launched or cancelled" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border p-5">
          <h2 className="text-[15px] font-medium">Revenue over time</h2>
          <p className="text-[12px] text-muted-foreground">Last 6 months, paid invoices</p>
          <div className="mt-4">
            <RevenueOverTimeChart data={revenueTrend} />
          </div>
        </div>

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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border p-5">
          <h2 className="text-[15px] font-medium">Average turnaround</h2>
          <p className="text-[12px] text-muted-foreground">Days from creation to launch, by package</p>
          <div className="mt-4 flex flex-col gap-3">
            {turnaround.map((t) => (
              <div key={t.packageId} className="flex items-center justify-between text-[13px]">
                <span>{t.name}</span>
                <span className="text-muted-foreground">
                  {t.avgDays === null ? "No launches yet" : `${t.avgDays} days · ${t.count} launched`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-medium">Pending requests</h2>
            <Link href="/dashboard/projects?tab=requests" className="text-[12px] text-brand-accent hover:underline">
              View all
            </Link>
          </div>
          <p className="text-[12px] text-muted-foreground">Awaiting your approval</p>
          <div className="mt-4 flex flex-col gap-3">
            {pendingRequests.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">Nothing pending.</p>
            ) : (
              pendingRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-[13px]">
                  <div>
                    <p className="font-medium">{r.prospectName}</p>
                    <p className="text-[12px] text-muted-foreground">{r.companyName ?? r.prospectEmail}</p>
                  </div>
                  <span className="text-[12px] text-muted-foreground">{formatDate(r.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border p-5">
        <h2 className="text-[15px] font-medium">Recently updated projects</h2>
        <div className="mt-4 flex flex-col divide-y divide-border">
          {[...projects]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5)
            .map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/projects/${p.id}`}
                className="flex items-center justify-between py-2.5 text-[13px] hover:text-brand-accent"
              >
                <span>{p.name}</span>
                <span className={PROJECT_STATUS_TONE[p.status]}>{PROJECT_STATUS_LABEL[p.status]}</span>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
