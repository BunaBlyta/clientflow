"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";
import {
  activeProjectCount,
  averageTurnaroundByPackage,
  outstandingInvoicesTotal,
  overdueInvoicesTotal,
  revenueByPackage,
  revenueOverTime,
  totalPaidRevenue,
} from "@/lib/analytics";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatTile } from "@/components/dashboard/stat-tile";
import { RevenueOverTimeChart } from "@/components/dashboard/charts/revenue-over-time-chart";
import { RevenueByPackageChart } from "@/components/dashboard/charts/revenue-by-package-chart";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE } from "@/lib/status";

const PACKAGE_LEGEND_COLORS = ["#2a78d6", "#eb6834", "#1baf7a"];

export default function OverviewPage() {
  const invoices = useAppStore((s) => s.invoices);
  const projects = useAppStore((s) => s.projects);
  const projectRequests = useAppStore((s) => s.projectRequests);

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
