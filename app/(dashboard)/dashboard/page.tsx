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
import { PROJECT_STATUS_TONE } from "@/lib/status";
import { Button } from "@/components/ui/button";
import type { Invoice, ManagedPackage, Project, ProjectRequest } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { formatRelativeTime } from "@/lib/relative-time";
import { NOTIFICATION_ICON } from "@/lib/notification-meta";
import { getNotificationDestination } from "@/lib/notification-destination";
import { cn } from "@/lib/utils";
import type { EntityChangedEvent } from "@/lib/realtime-notification-store";
import { useNotificationStore } from "@/lib/realtime-notification-store";

const PACKAGE_LEGEND_COLORS = ["#2a78d6", "#eb6834", "#1baf7a"];

export default function OverviewPage() {
  const { t } = useLocale();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [packages, setPackages] = useState<ManagedPackage[]>([]);
  const [projectRequests, setProjectRequests] = useState<ProjectRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const notifications = useNotificationStore((state) => state.notifications);
  const notificationsLoading = useNotificationStore((state) => state.isLoading);

  const loadOverview = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const [invoiceData, projectData, requestData, packageData] = await Promise.all([
        fetchJson<Invoice[]>("/api/invoices", "We couldn't load the invoices.", signal),
        fetchJson<Project[]>("/api/projects", "We couldn't load the projects.", signal),
        fetchJson<ProjectRequest[]>("/api/requests", "We couldn't load project requests.", signal),
        fetchJson<ManagedPackage[]>("/api/packages", "We couldn't load the packages.", signal),
      ]);

      if (
        !Array.isArray(invoiceData) ||
        !Array.isArray(projectData) ||
        !Array.isArray(requestData) ||
        !Array.isArray(packageData)
      ) {
        throw new Error("The server returned an unexpected overview response.");
      }

      if (!signal?.aborted) {
        setInvoices(invoiceData);
        setProjects(projectData);
        setProjectRequests(requestData);
        setPackages(packageData);
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

  useEffect(() => {
    const handleEntityChanged = (event: Event) => {
      const detail = (event as CustomEvent<EntityChangedEvent>).detail;
      if (
        detail?.entity === "invoice" ||
        detail?.entity === "project" ||
        detail?.entity === "request"
      ) {
        void loadOverview();
      }
    };
    window.addEventListener("clientflow:entity-changed", handleEntityChanged);
    return () => window.removeEventListener("clientflow:entity-changed", handleEntityChanged);
  }, [loadOverview]);

  if (isLoading) {
    return (
      <div className="flex min-h-56 items-center justify-center border border-border">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin text-brand-accent" />
          {t("dashboard.loading")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center border border-status-danger/30 px-6 text-center">
        <p className="text-[13px] font-medium text-status-danger">{t("dashboard.loadFailed")}</p>
        <p className="mt-1 max-w-sm text-[12px] text-muted-foreground">{error}</p>
        <Button className="mt-4" variant="outline" size="sm" onClick={() => void loadOverview()}>
          <RefreshCw />
          {t("common.tryAgain")}
        </Button>
      </div>
    );
  }

  const revenueTrend = revenueOverTime(invoices);
  const revenueByPkg = revenueByPackage(invoices, projects, packages);
  const turnaround = averageTurnaroundByPackage(projects, packages);
  const pendingRequests = projectRequests.filter((r) => r.status === "PENDING");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-[22px]">{t("dashboard.overview")}</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {t("dashboard.overviewIntro")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t("dashboard.totalRevenue")} value={formatCurrency(totalPaidRevenue(invoices))} hint={t("dashboard.allTimePaid")} />
        <StatTile
          label={t("dashboard.outstanding")}
          value={formatCurrency(outstandingInvoicesTotal(invoices))}
          hint={t("dashboard.sentPendingFailed")}
        />
        <StatTile
          label={t("dashboard.overdue")}
          value={formatCurrency(overdueInvoicesTotal(invoices))}
          tone="danger"
          hint={t("dashboard.pastDueUnpaid")}
        />
        <StatTile label={t("dashboard.activeProjects")} value={String(activeProjectCount(projects))} hint={t("dashboard.notLaunchedCancelled")} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border p-5">
          <h2 className="text-[15px] font-medium">{t("dashboard.revenueOverTime")}</h2>
          <p className="text-[12px] text-muted-foreground">{t("dashboard.lastMonthsPaid", { months: 6 })}</p>
          <div className="mt-4">
            <RevenueOverTimeChart data={revenueTrend} />
          </div>
        </div>

        <div className="rounded-lg border border-border p-5">
          <h2 className="text-[15px] font-medium">{t("dashboard.revenueByPackage")}</h2>
          <p className="text-[12px] text-muted-foreground">{t("dashboard.allTimePaid")}</p>
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
          <h2 className="text-[15px] font-medium">{t("dashboard.avgTurnaround")}</h2>
          <p className="text-[12px] text-muted-foreground">{t("dashboard.daysFromCreation")}</p>
          <div className="mt-4 flex flex-col gap-3">
            {turnaround.map((turnaroundRow) => (
              <div key={turnaroundRow.packageId} className="flex items-center justify-between text-[13px]">
                <span>{turnaroundRow.name}</span>
                <span className="text-muted-foreground">
                  {turnaroundRow.avgDays === null ? t("dashboard.noLaunches") : `${turnaroundRow.avgDays} days · ${turnaroundRow.count} launched`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-medium">{t("dashboard.pendingRequests")}</h2>
            <Link href="/dashboard/projects?tab=requests" className="text-[12px] text-brand-accent hover:underline">
              {t("notifications.viewAll")}
            </Link>
          </div>
          <p className="text-[12px] text-muted-foreground">{t("dashboard.awaitingApproval")}</p>
          <div className="mt-4 flex flex-col gap-3">
            {pendingRequests.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">{t("dashboard.nothingPending")}</p>
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
        <h2 className="text-[15px] font-medium">{t("dashboard.recentProjects")}</h2>
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
                <span className={PROJECT_STATUS_TONE[p.status]}>{t(`status.project.${p.status}`)}</span>
              </Link>
            ))}
        </div>
      </div>

      <div className="rounded-lg border border-border p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-medium">{t("nav.notifications")}</h2>
          <Link href="/dashboard/notifications" className="text-[12px] text-brand-accent hover:underline">
            {t("notifications.viewAll")}
          </Link>
        </div>
        <div className="mt-4 flex flex-col divide-y divide-border">
          {notificationsLoading ? (
            <p className="py-2 text-[13px] text-muted-foreground">{t("common.loading")}</p>
          ) : notifications.length === 0 ? (
            <p className="py-2 text-[13px] text-muted-foreground">{t("notifications.noNotifications")}</p>
          ) : (
            notifications.slice(0, 5).map((notification) => {
              const Icon = NOTIFICATION_ICON[notification.type];
              return (
                <Link
                  key={notification.id}
                  href={getNotificationDestination(notification)}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 hover:text-brand-accent"
                >
                  <Icon
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      notification.read ? "text-muted-foreground/70" : "text-brand-accent",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-[13px]", !notification.read && "font-medium")}>
                      {notification.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                      {notification.body}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
