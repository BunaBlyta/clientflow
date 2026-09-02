"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle, RefreshCw } from "lucide-react";
import {
  activeProjectCount,
  averageTurnaroundByPackage,
} from "@/lib/analytics";
import { fetchJson } from "@/lib/fetch-json";
import { fetchDashboardData, invalidateDashboardData } from "@/lib/dashboard-data-cache";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatTile } from "@/components/dashboard/stat-tile";
import { PROJECT_STATUS_TONE } from "@/lib/status";
import { Button } from "@/components/ui/button";
import type { CustomLead, CustomLeadDetail, Invoice, ManagedPackage, Project, ProjectRequest, ProjectStatus } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { EntityChangedEvent } from "@/lib/realtime-notification-store";
import { useNotificationStore } from "@/lib/realtime-notification-store";
import { upsertById } from "@/lib/upsert-by-id";

const PIPELINE_STAGES: ProjectStatus[] = [
  "PENDING",
  "DISCOVERY",
  "DESIGN",
  "DEVELOPMENT",
  "REVIEW",
  "ON_HOLD",
];

const PIPELINE_TONES: Record<ProjectStatus, string> = {
  PENDING: "bg-status-warning",
  DISCOVERY: "bg-brand-accent/55",
  DESIGN: "bg-brand-accent/70",
  DEVELOPMENT: "bg-brand-accent",
  REVIEW: "bg-status-warning/80",
  ON_HOLD: "bg-muted-foreground/60",
  LAUNCHED: "bg-status-success",
  CANCELLED: "bg-status-danger",
};

export default function OverviewPage() {
  const { t } = useLocale();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [packages, setPackages] = useState<ManagedPackage[]>([]);
  const [projectRequests, setProjectRequests] = useState<ProjectRequest[]>([]);
  const [customLeads, setCustomLeads] = useState<CustomLead[]>([]);
  const [overviewRowLimit, setOverviewRowLimit] = useState(2);
  const [now] = useState(() => Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const notifications = useNotificationStore((state) => state.notifications);

  const loadOverview = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const [invoiceData, projectData, requestData, packageData, customLeadData] = await Promise.all([
        fetchDashboardData<Invoice[]>("/api/invoices", "We couldn't load the invoices."),
        fetchDashboardData<Project[]>("/api/projects", "We couldn't load the projects."),
        fetchDashboardData<ProjectRequest[]>("/api/requests", "We couldn't load project requests."),
        fetchDashboardData<ManagedPackage[]>("/api/packages", "We couldn't load the packages."),
        fetchDashboardData<CustomLead[]>("/api/contact-leads", "We couldn't load custom inquiries."),
      ]);

      if (
        !Array.isArray(invoiceData) ||
        !Array.isArray(projectData) ||
        !Array.isArray(requestData) ||
        !Array.isArray(packageData) ||
        !Array.isArray(customLeadData)
      ) {
        throw new Error("The server returned an unexpected overview response.");
      }

      if (!signal?.aborted) {
        setInvoices(invoiceData);
        setProjects(projectData);
        setProjectRequests(requestData);
        setPackages(packageData);
        setCustomLeads(customLeadData);
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
    const updateOverviewRowLimit = () => {
      const availableHeight = window.innerHeight - 568;
      setOverviewRowLimit(Math.max(2, Math.floor(availableHeight / 64)));
    };

    updateOverviewRowLimit();
    window.addEventListener("resize", updateOverviewRowLimit);
    return () => window.removeEventListener("resize", updateOverviewRowLimit);
  }, []);

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
      } else if (detail?.entity === "request") {
        void fetchJson<ProjectRequest>(
          `/api/requests/${encodeURIComponent(detail.id)}`,
          "We couldn't refresh this request.",
        )
          .then((projectRequest) =>
            setProjectRequests((current) =>
              current.some((request) => request.id === projectRequest.id)
                ? upsertById(current, projectRequest)
                : [projectRequest, ...current],
            ),
          )
          .catch(() => undefined);
      } else if (detail?.entity === "lead") {
        void fetchJson<CustomLeadDetail>(
          `/api/contact-leads/${encodeURIComponent(detail.id)}`,
          "We couldn't refresh this inquiry.",
        )
          .then((lead) =>
            setCustomLeads((current) => {
              const updatedLead = {
                ...lead,
                ...(lead.client ? { clientId: lead.client.id } : {}),
              };
              return current.some((currentLead) => currentLead.id === updatedLead.id)
                ? upsertById(current, updatedLead)
                : [updatedLead, ...current];
            }),
          )
          .catch(() => undefined);
      }
    };
    window.addEventListener("clientflow:entity-changed", handleEntityChanged);
    return () => window.removeEventListener("clientflow:entity-changed", handleEntityChanged);
  }, []);

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

  const turnaround = averageTurnaroundByPackage(projects, packages);
  const pendingRequests = projectRequests.filter((r) => r.status === "PENDING");
  const unreadNotifications = notifications.filter((notification) => !notification.read);
  const customInquiries = customLeads.filter((lead) => !lead.clientId);
  const overdueInvoices = invoices.filter(
    (invoice) =>
      ["SENT", "PAYMENT_PENDING", "FAILED"].includes(invoice.status) &&
      invoice.dueDate &&
      new Date(invoice.dueDate).getTime() < now,
  );
  const upcomingLaunches = projects
    .filter((project) => !["LAUNCHED", "CANCELLED"].includes(project.status))
    .sort((a, b) => {
      if (!a.targetLaunchDate && !b.targetLaunchDate) return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (!a.targetLaunchDate) return 1;
      if (!b.targetLaunchDate) return -1;
      return new Date(a.targetLaunchDate).getTime() - new Date(b.targetLaunchDate).getTime();
    });
  const pipelineCounts = new Map(
    PIPELINE_STAGES.map((status) => [status, projects.filter((project) => project.status === status).length]),
  );
  const activePipelineTotal = PIPELINE_STAGES.reduce((total, status) => total + (pipelineCounts.get(status) ?? 0), 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="overview-kpi-strip grid overflow-hidden rounded-lg dark:border dark:border-border dark:bg-card sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t("dashboard.activeProjects")} value={String(activeProjectCount(projects))} hint={t("dashboard.kpiActiveHint")} />
        <StatTile label={t("dashboard.pendingRequests")} value={String(pendingRequests.length)} hint={t("dashboard.kpiPendingHint")} />
        <StatTile label={t("nav.projects")} value={String(projects.length)} hint={t("dashboard.kpiProjectsHint")} />
        <StatTile label={t("nav.notifications")} value={String(unreadNotifications.length)} hint={t("dashboard.kpiNotificationsHint")} />
      </div>

      <div className="overview-pipeline rounded-lg border-0 p-5 shadow-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-medium">{t("dashboard.pipelineByStage")}</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">{t("dashboard.everyProjectCurrentStage")}</p>
          </div>
          <span className="shrink-0 text-[12px] text-muted-foreground">
            {activePipelineTotal} {t("dashboard.activeProjects")}
          </span>
        </div>

        <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          {activePipelineTotal === 0 ? (
            <span className="h-full w-full bg-muted-foreground/25" />
          ) : (
            PIPELINE_STAGES.map((status) => {
              const count = pipelineCounts.get(status) ?? 0;
              if (count === 0) return null;
              return (
                <span
                  key={status}
                  className={cn("h-full min-w-1 transition-[width] duration-200", PIPELINE_TONES[status])}
                  style={{ width: `${(count / activePipelineTotal) * 100}%` }}
                />
              );
            })
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
          {PIPELINE_STAGES.map((status) => (
            <div key={status} className="flex min-w-0 items-center gap-2 text-[12px]">
              <span className={cn("size-2 shrink-0 rounded-full", PIPELINE_TONES[status])} />
              <span className="min-w-0 truncate text-muted-foreground">{t(`status.project.${status}`)}</span>
              <span className="ml-auto tabular-nums text-foreground">{pipelineCounts.get(status) ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overview-card rounded-lg p-5">
          <div className="border-b border-border pb-3">
            <h2 className="text-[15px] font-medium">{t("dashboard.avgTurnaround")}</h2>
            <p className="text-[12px] text-muted-foreground">{t("dashboard.daysFromCreation")}</p>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {turnaround.map((turnaroundRow) => (
              <div key={turnaroundRow.packageId} className="grid min-h-14 min-w-0 grid-cols-2 items-center gap-4 rounded-md px-2 py-3 text-[13px] hover:bg-muted/40">
                <span className="min-w-0 truncate">{turnaroundRow.name}</span>
                <span className="min-w-0 text-right text-[12px] text-muted-foreground">
                  {turnaroundRow.avgDays === null ? t("dashboard.noLaunches") : `${turnaroundRow.avgDays} days · ${turnaroundRow.count} launched`}
                </span>
              </div>
            ))}
          </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overview-card rounded-lg p-5">
          <div className="border-b border-border pb-3">
            <h2 className="text-[15px] font-medium">{t("dashboard.recentProjects")}</h2>
          </div>
          <div className="mt-4 grid auto-rows-[56px] gap-2">
            {[...projects]
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, overviewRowLimit)
              .map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/projects/${p.id}`}
                  className="flex min-h-14 min-w-0 items-center justify-between gap-4 rounded-md px-2 py-3 text-[13px] hover:bg-muted/40 hover:text-brand-accent"
                >
                  <span className="min-w-0 truncate">{p.name}</span>
                  <span className={cn("shrink-0 text-[12px]", PROJECT_STATUS_TONE[p.status])}>{t(`status.project.${p.status}`)}</span>
                </Link>
              ))}
          </div>
        </div>

        <div className="overview-card rounded-lg p-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-[15px] font-medium">{t("dashboard.projectSchedule")}</h2>
            <Link href="/dashboard/projects" className="text-[12px] text-brand-accent hover:underline">
              {t("notifications.viewAll")}
            </Link>
          </div>
          <div className="mt-4 grid auto-rows-[56px] gap-2">
            {upcomingLaunches.length === 0 ? (
              <p className="py-2 text-[13px] text-muted-foreground">{t("dashboard.noActiveProjects")}</p>
            ) : (
              upcomingLaunches.slice(0, overviewRowLimit).map((project) => {
                return (
                  <Link
                    key={project.id}
                    href={`/dashboard/projects/${project.id}`}
                    className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 rounded-md px-2 py-3 text-[13px] hover:bg-muted/40 hover:text-brand-accent"
                  >
                    <span className="min-w-0 truncate">{project.name}</span>
                    <span className={cn("whitespace-nowrap text-[12px]", PROJECT_STATUS_TONE[project.status])}>
                      {t(`status.project.${project.status}`)}
                    </span>
                    <span className="whitespace-nowrap text-right text-[12px] text-muted-foreground">
                      {project.targetLaunchDate ? formatDate(project.targetLaunchDate) : t("dashboard.notScheduled")}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="overview-card rounded-lg p-5">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
          <div>
            <h2 className="text-[15px] font-medium">{t("dashboard.workQueue")}</h2>
            <p className="text-[12px] text-muted-foreground">{t("dashboard.workQueueIntro")}</p>
          </div>
          <Link href="/dashboard/projects" className="text-[12px] text-brand-accent hover:underline">
            {t("notifications.viewAll")}
          </Link>
        </div>
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[13px] font-medium">{t("dashboard.pendingRequests")}</h3>
              <span className="text-[12px] text-muted-foreground">{pendingRequests.length}</span>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {pendingRequests.length === 0 ? (
                <p className="py-2 text-[13px] text-muted-foreground">{t("dashboard.nothingPending")}</p>
              ) : (
                pendingRequests.slice(0, 4).map((request) => (
                  <Link key={request.id} href={`/dashboard/requests/${request.id}`} className="flex min-h-14 min-w-0 items-center justify-between gap-3 rounded-md px-2 py-3 text-[13px] hover:bg-muted/40 hover:text-brand-accent">
                    <span className="min-w-0 truncate">{request.companyName ?? request.prospectName}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{formatDate(request.createdAt)}</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[13px] font-medium">{t("projects.tabCustom")}</h3>
              <span className="text-[12px] text-muted-foreground">{customInquiries.length}</span>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {customInquiries.length === 0 ? (
                <p className="py-2 text-[13px] text-muted-foreground">{t("dashboard.workQueueEmpty")}</p>
              ) : (
                customInquiries.slice(0, 4).map((inquiry) => (
                  <Link key={inquiry.id} href={`/dashboard/inquiries/${inquiry.id}`} className="flex min-h-14 min-w-0 items-center justify-between gap-3 rounded-md px-2 py-3 text-[13px] hover:bg-muted/40 hover:text-brand-accent">
                    <span className="min-w-0 truncate">{inquiry.name}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{formatDate(inquiry.createdAt)}</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[13px] font-medium">{t("dashboard.overdueInvoices")}</h3>
              <span className="text-[12px] text-muted-foreground">{overdueInvoices.length}</span>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {overdueInvoices.length === 0 ? (
                <p className="py-2 text-[13px] text-muted-foreground">{t("dashboard.workQueueEmpty")}</p>
              ) : (
                overdueInvoices.slice(0, 4).map((invoice) => (
                  <Link key={invoice.id} href="/dashboard/invoices" className="flex min-h-14 min-w-0 items-center justify-between gap-3 rounded-md px-2 py-3 text-[13px] hover:bg-muted/40 hover:text-brand-accent">
                    <span className="min-w-0 truncate">{invoice.label}</span>
                    <span className="shrink-0 text-[11px] text-status-danger">{formatCurrency(invoice.amountCents)}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
