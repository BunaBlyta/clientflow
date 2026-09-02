"use client";

import { Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, RefreshCw, X } from "lucide-react";
import { fetchJson } from "@/lib/fetch-json";
import { formatDate } from "@/lib/format";
import { isTableRowInteractiveTarget } from "@/lib/table-navigation";
import { TableToolbar } from "@/components/dashboard/table-toolbar";
import { InfiniteTableLoader, useInfiniteTable } from "@/components/dashboard/infinite-table-loader";
import { useStableTableColumns } from "@/components/dashboard/use-stable-table-columns";
import { SortableTableHeader } from "@/components/dashboard/sortable-table-header";
import { ProjectStatusMenu } from "@/components/dashboard/project-status-menu";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { CustomLeadsTable } from "@/components/dashboard/custom-leads-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Package, Project, ProjectRequest, ProjectStatus } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import type { EntityChangedEvent } from "@/lib/realtime-notification-store";
import { PROJECT_STATUS_TONE } from "@/lib/status";
import { upsertById } from "@/lib/upsert-by-id";
import { EMPTY_TABLE_FILTERS, usePreferencesStore } from "@/lib/preferences-store";
import type { PaginatedResponse } from "@/lib/pagination";

const STATUS_FILTERS: { value: ProjectStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "DISCOVERY", label: "Discovery" },
  { value: "DESIGN", label: "Design" },
  { value: "DEVELOPMENT", label: "Development" },
  { value: "REVIEW", label: "Review" },
  { value: "LAUNCHED", label: "Launched" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "CANCELLED", label: "Cancelled" },
];

function ProjectsPageInner() {
  const router = useRouter();
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = tabParam === "requests" || tabParam === "custom" ? tabParam : "projects";
  const projectFilters = usePreferencesStore((state) => state.tableFilters.projects) ?? EMPTY_TABLE_FILTERS;
  const setTableFilter = usePreferencesStore((state) => state.setTableFilter);
  const projectSearch = projectFilters.search ?? "";
  const projectStatusFilter = (projectFilters.status ?? "ALL") as ProjectStatus | "ALL";
  const projectPackageFilter = projectFilters.package ?? "ALL";
  const setProjectSearch = (value: string) => setTableFilter("projects", "search", value);
  const setProjectStatusFilter = (value: ProjectStatus | "ALL") => setTableFilter("projects", "status", value);
  const setProjectPackageFilter = (value: string) => setTableFilter("projects", "package", value);
  const [packages, setPackages] = useState<Pick<Package, "id" | "name">[]>([]);
  const [requestSearch, setRequestSearch] = useState("");
  const [customSearch, setCustomSearch] = useState("");

  useEffect(() => {
    void fetchJson<Pick<Package, "id" | "name">[]>("/api/packages", "We couldn't load packages.")
      .then((data) => setPackages(Array.isArray(data) ? data : []))
      .catch(() => undefined);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        value={tab}
        onValueChange={(value) => {
          router.replace(value === "projects" ? "/dashboard/projects" : `/dashboard/projects?tab=${value}`);
        }}
      >
        <div className="flex min-w-0 items-center gap-3 overflow-x-auto pb-1">
          <TabsList>
            <TabsTrigger value="projects">{t("projects.tabProjects")}</TabsTrigger>
            <TabsTrigger value="requests">{t("projects.tabRequests")}</TabsTrigger>
            <TabsTrigger value="custom">{t("projects.tabCustom")}</TabsTrigger>
          </TabsList>
          {tab === "projects" && (
            <TableToolbar
              search={projectSearch}
              onSearchChange={setProjectSearch}
              placeholder={t("projects.search")}
              className="flex-nowrap gap-2"
            >
              <Select
                value={projectStatusFilter}
                onValueChange={(value) => value && setProjectStatusFilter(value as ProjectStatus | "ALL")}
                >
                <SelectTrigger className="w-44">
                  <span className={projectStatusFilter === "ALL" ? "text-foreground" : PROJECT_STATUS_TONE[projectStatusFilter]}>
                    {projectStatusFilter === "ALL" ? t("status.filter.ALL") : t(`status.project.${projectStatusFilter}`)}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      <span className={filter.value === "ALL" ? "text-foreground" : PROJECT_STATUS_TONE[filter.value]}>
                        {filter.value === "ALL" ? t("status.filter.ALL") : t(`status.project.${filter.value}`)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={projectPackageFilter} onValueChange={(value) => value && setProjectPackageFilter(value)}>
                <SelectTrigger className="w-44"><span>{projectPackageFilter === "ALL" ? t("projects.allPackages") : packages.find((item) => item.id === projectPackageFilter)?.name}</span></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("projects.allPackages")}</SelectItem>
                  {packages.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </TableToolbar>
          )}
          {tab === "requests" && (
            <TableToolbar search={requestSearch} onSearchChange={setRequestSearch} placeholder={t("projects.searchRequests")} />
          )}
          {tab === "custom" && (
            <TableToolbar search={customSearch} onSearchChange={setCustomSearch} placeholder={t("projects.searchInquiries")} />
          )}
        </div>
        <TabsContent value="projects" className="mt-4">
          <ProjectsTable
            search={projectSearch}
            statusFilter={projectStatusFilter}
            packageFilter={projectPackageFilter}
          />
        </TabsContent>
        <TabsContent value="requests" className="mt-4">
          <RequestsTable search={requestSearch} />
        </TabsContent>
        <TabsContent value="custom" className="mt-4">
          <CustomLeadsTable search={customSearch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense>
      <ProjectsPageInner />
    </Suspense>
  );
}

function ProjectsTable({
  search,
  statusFilter,
  packageFilter,
}: {
  search: string;
  statusFilter: ProjectStatus | "ALL";
  packageFilter: string;
}) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const deferredSearch = useDeferredValue(search);
  const savedSort = usePreferencesStore((state) => state.tableSort.projects) as { key?: "name" | "status" | "updatedAt"; direction?: "asc" | "desc" } | undefined;
  const setTableSort = usePreferencesStore((state) => state.setTableSort);
  const sort = useMemo(() => ({ key: savedSort?.key ?? "updatedAt", direction: savedSort?.direction ?? "desc" } as { key: "name" | "status" | "updatedAt"; direction: "asc" | "desc" }), [savedSort?.direction, savedSort?.key]);
  const setSort = (updater: (current: typeof sort) => typeof sort) => setTableSort("projects", updater(sort));

  const loadProjectPage = useCallback((page: number, signal?: AbortSignal) => {
    const query = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (deferredSearch.trim()) query.set("search", deferredSearch.trim());
    if (statusFilter !== "ALL") query.set("status", statusFilter);
    if (packageFilter !== "ALL") query.set("packageId", packageFilter);
    query.set("sort", sort.key); query.set("direction", sort.direction);
    return fetchJson<PaginatedResponse<Project>>(
      `/api/projects?${query.toString()}`,
      "We couldn't load the projects.",
      signal,
    );
  }, [deferredSearch, packageFilter, sort, statusFilter]);
  const projectTable = useInfiniteTable(loadProjectPage);
  const projects = projectTable.items;
  const setProjects = projectTable.setItems;
  const isLoading = projectTable.isInitialLoading;
  const error = projectTable.error;
  const tableRef = useStableTableColumns(!isLoading && !error);
  const projectMatchesFilters = useCallback((project: Project) => (
    (statusFilter === "ALL" || project.status === statusFilter) &&
    (packageFilter === "ALL" || project.packageId === packageFilter) &&
    project.name.toLowerCase().includes(deferredSearch.trim().toLowerCase())
  ), [deferredSearch, packageFilter, statusFilter]);

  useEffect(() => {
    const handleEntityChanged = (event: Event) => {
      const detail = (event as CustomEvent<EntityChangedEvent>).detail;
      if (detail?.entity !== "project") return;
      void fetchJson<Project>(
        `/api/projects/${encodeURIComponent(detail.id)}`,
        "We couldn't refresh this project.",
      )
        .then((updatedProject) => setProjects((currentProjects) => {
          if (!projectMatchesFilters(updatedProject)) {
            return currentProjects.filter((project) => project.id !== updatedProject.id);
          }
          return upsertById(currentProjects, updatedProject)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        }))
        .catch(() => undefined);
    };
    window.addEventListener("clientflow:entity-changed", handleEntityChanged);
    return () => window.removeEventListener("clientflow:entity-changed", handleEntityChanged);
  }, [projectMatchesFilters, setProjects]);

  const handleProjectUpdated = useCallback((updatedProject: Project) => {
    setProjects((currentProjects) => {
      if (!projectMatchesFilters(updatedProject)) {
        return currentProjects.filter((project) => project.id !== updatedProject.id);
      }
      return upsertById(currentProjects, updatedProject)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
  }, [projectMatchesFilters, setProjects]);

  if (isLoading) {
    return (
      <div className="flex min-h-56 items-center justify-center border border-border">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin text-brand-accent" />
          {t("projects.loading")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center border border-status-danger/30 px-6 text-center">
        <p className="text-[13px] font-medium text-status-danger">{t("dashboard.projectsLoadFailed")}</p>
        <p className="mt-1 max-w-sm text-[12px] text-muted-foreground">{error}</p>
        <Button className="mt-4" variant="outline" size="sm" onClick={() => {
          projectTable.reload();
        }}>
          <RefreshCw />
          {t("common.tryAgain")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table ref={tableRef} className="w-full text-[13px]" style={{ overflowAnchor: "none" }}>
          <colgroup>
            <col />
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
              <SortableTableHeader label={t("projects.project")} active={sort.key === "name"} direction={sort.direction} onClick={() => setSort((current) => ({ key: "name", direction: current.key === "name" && current.direction === "asc" ? "desc" : "asc" }))} className="px-4 py-2.5" />
              <th className="px-4 py-2.5 font-normal">{t("projects.client")}</th>
              <th className="px-4 py-2.5 font-normal">{t("projects.package")}</th>
              <SortableTableHeader label={t("common.status")} active={sort.key === "status"} direction={sort.direction} onClick={() => setSort((current) => ({ key: "status", direction: current.key === "status" && current.direction === "asc" ? "desc" : "asc" }))} className="px-4 py-2.5" />
              <SortableTableHeader label={t("projects.updated")} active={sort.key === "updatedAt"} direction={sort.direction} onClick={() => setSort((current) => ({ key: "updatedAt", direction: current.key === "updatedAt" && current.direction === "asc" ? "desc" : "asc" }))} className="px-4 py-2.5 text-right" />
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const packageLabel = project.package?.name ?? "Custom project";
              return (
                <tr
                  key={project.id}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-accent"
                  role="link"
                  tabIndex={0}
                  aria-label={`Open ${project.name}`}
                  onClick={(event) => {
                    if (!isTableRowInteractiveTarget(event.target)) {
                      router.push(`/dashboard/projects/${project.id}`);
                    }
                  }}
                  onKeyDown={(event) => {
                    if ((event.key === "Enter" || event.key === " ") && !isTableRowInteractiveTarget(event.target)) {
                      event.preventDefault();
                      router.push(`/dashboard/projects/${project.id}`);
                    }
                  }}
                >
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/projects/${project.id}`} className="font-medium hover:text-brand-accent">
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {project.clientName ?? t("common.unknown")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{packageLabel}</td>
                  <td className="px-4 py-3">
                    <ProjectStatusMenu
                      project={project}
                      onProjectUpdated={handleProjectUpdated}
                    />
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatDate(project.updatedAt, locale)}
                  </td>
                </tr>
              );
            })}
            {projects.length === 0 && !deferredSearch.trim() && statusFilter === "ALL" && packageFilter === "ALL" && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <p className="text-[13px] font-medium">{t("projects.noProjects")}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">{t("projects.noProjectsIntro")}</p>
                </td>
              </tr>
            )}
            {projects.length === 0 && (deferredSearch.trim() || statusFilter !== "ALL" || packageFilter !== "ALL") && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  {t("projects.noMatch")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <InfiniteTableLoader
        hasMore={projectTable.hasMore}
        isLoading={projectTable.isLoadingMore}
        error={projectTable.loadMoreError}
        onLoadMore={projectTable.loadMore}
      />
    </div>
  );
}

function RequestsTable({ search }: { search: string }) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const deferredSearch = useDeferredValue(search);
  const [packages, setPackages] = useState<Pick<Package, "id" | "name">[]>([]);
  const [arePackagesLoading, setArePackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const loadPackages = useCallback(async (signal?: AbortSignal) => {
    setArePackagesLoading(true);
    setPackagesError(null);
    try {
      const data = await fetchJson<Pick<Package, "id" | "name">[]>("/api/packages", "We couldn't load packages.", signal);
      if (!Array.isArray(data)) throw new Error("The server returned an unexpected package response.");
      if (!signal?.aborted) setPackages(data);
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
      if (!signal?.aborted) setPackagesError(caughtError instanceof Error ? caughtError.message : "We couldn't load packages.");
    } finally {
      if (!signal?.aborted) setArePackagesLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadPackages(controller.signal));
    return () => controller.abort();
  }, [loadPackages]);

  const loadRequestPage = useCallback((page: number, signal?: AbortSignal) => {
    const query = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (deferredSearch.trim()) query.set("search", deferredSearch.trim());
    return fetchJson<PaginatedResponse<ProjectRequest>>(
      `/api/requests?${query.toString()}`,
      "We couldn't load project requests.",
      signal,
    );
  }, [deferredSearch]);
  const requestTable = useInfiniteTable(loadRequestPage);
  const projectRequests = requestTable.items;
  const setProjectRequests = requestTable.setItems;
  const isLoading = requestTable.isInitialLoading || arePackagesLoading;
  const error = requestTable.error ?? packagesError ?? actionError;
  const tableRef = useStableTableColumns(!isLoading && !error);
  const requestMatchesSearch = useCallback((request: ProjectRequest) => {
    const query = deferredSearch.trim().toLowerCase();
    return `${request.prospectName} ${request.companyName ?? ""} ${request.prospectEmail}`
      .toLowerCase()
      .includes(query);
  }, [deferredSearch]);

  useEffect(() => {
    const handleEntityChanged = (event: Event) => {
      const detail = (event as CustomEvent<EntityChangedEvent>).detail;
      if (detail?.entity !== "request") return;
      void fetchJson<ProjectRequest>(
        `/api/requests/${encodeURIComponent(detail.id)}`,
        "We couldn't refresh this request.",
      )
        .then((updatedRequest) => setProjectRequests((currentRequests) => {
          if (!requestMatchesSearch(updatedRequest)) {
            return currentRequests.filter((request) => request.id !== updatedRequest.id);
          }
          return currentRequests.some((request) => request.id === updatedRequest.id)
            ? upsertById(currentRequests, updatedRequest)
            : [updatedRequest, ...currentRequests];
        }))
        .catch(() => undefined);
    };

    window.addEventListener("clientflow:entity-changed", handleEntityChanged);
    return () => window.removeEventListener("clientflow:entity-changed", handleEntityChanged);
  }, [requestMatchesSearch, setProjectRequests]);

  const updateRequest = useCallback(async (requestId: string, status: "APPROVED" | "REJECTED") => {
    const previousRequest = projectRequests.find((request) => request.id === requestId);
    setActionError(null);
    setUpdatingId(requestId);
    if (previousRequest) {
      setProjectRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === requestId
            ? { ...request, status, reviewedAt: new Date().toISOString() }
            : request,
        ),
      );
    }
    try {
      const response = await fetch(`/api/requests/${encodeURIComponent(requestId)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json().catch(() => null)) as
        | ProjectRequest
        | { request: ProjectRequest; emailSent: boolean }
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          payload && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "We couldn't update this request.",
        );
      }
      const updatedRequest = payload && "request" in payload ? payload.request : payload;
      if (!updatedRequest || !("id" in updatedRequest)) {
        throw new Error("The server returned an unexpected request update.");
      }
      setProjectRequests((currentRequests) =>
        upsertById(currentRequests, updatedRequest),
      );
      setRejectingId(null);
    } catch (caughtError) {
      if (previousRequest) {
        setProjectRequests((currentRequests) => upsertById(currentRequests, previousRequest));
      }
      setActionError(caughtError instanceof Error ? caughtError.message : "We couldn't update this request.");
    } finally {
      setUpdatingId(null);
    }
  }, [projectRequests, setProjectRequests]);

  const packageNames = useMemo(() => new Map(packages.map((pkg) => [pkg.id, pkg.name])), [packages]);

  if (isLoading) {
    return (
      <div className="flex min-h-56 items-center justify-center border border-border">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin text-brand-accent" />
          {t("projects.requestsLoading")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center border border-status-danger/30 px-6 text-center">
        <p className="text-[13px] font-medium text-status-danger">{t("dashboard.requestsLoadFailed")}</p>
        <p className="mt-1 max-w-sm text-[12px] text-muted-foreground">{error}</p>
        <Button className="mt-4" variant="outline" size="sm" onClick={() => {
          setActionError(null);
          requestTable.reload();
          if (packagesError) void loadPackages();
        }}>
          <RefreshCw />
          {t("common.tryAgain")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table ref={tableRef} className="w-full text-[13px]" style={{ overflowAnchor: "none" }}>
          <colgroup>
            <col />
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">{t("projects.prospect")}</th>
              <th className="px-4 py-2.5 font-normal">{t("projects.package")}</th>
              <th className="px-4 py-2.5 font-normal">{t("common.status")}</th>
              <th className="px-4 py-2.5 font-normal">{t("projects.submitted")}</th>
              <th className="px-4 py-2.5 text-right font-normal">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {projectRequests.map((r) => {
              return (
                <tr
                  key={r.id}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-accent"
                  role="link"
                  tabIndex={0}
                  aria-label={`Open request from ${r.prospectName}`}
                  onClick={(event) => {
                    if (!isTableRowInteractiveTarget(event.target)) {
                      router.push(`/dashboard/requests/${r.id}`);
                    }
                  }}
                  onKeyDown={(event) => {
                    if ((event.key === "Enter" || event.key === " ") && !isTableRowInteractiveTarget(event.target)) {
                      event.preventDefault();
                      router.push(`/dashboard/requests/${r.id}`);
                    }
                  }}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.prospectName}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {r.companyName ?? r.prospectEmail}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {packageNames.get(r.packageId) ?? t("projects.unknownPackage")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        r.status === "PENDING"
                          ? "text-status-warning"
                          : r.status === "APPROVED"
                            ? "text-status-success"
                            : "text-muted-foreground"
                      }
                    >
                      {t(`status.request.${r.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(r.createdAt, locale)}</td>
                  <td className="px-4 py-3">
                    {r.status === "PENDING" ? (
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="icon-sm"
                          variant="outline"
                          disabled={updatingId !== null}
                          onClick={() => void updateRequest(r.id, "APPROVED")}
                        >
                          {updatingId === r.id ? <LoaderCircle className="animate-spin" /> : <Check className="text-status-success" />}
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          disabled={updatingId !== null}
                          onClick={() => setRejectingId(r.id)}
                        >
                          <X className="text-status-danger" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-right text-[12px] text-muted-foreground">
                        {r.reviewedAt && formatDate(r.reviewedAt, locale)}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
            {projectRequests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  {t("projects.noRequests")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <InfiniteTableLoader
        hasMore={requestTable.hasMore}
        isLoading={requestTable.isLoadingMore}
        error={requestTable.loadMoreError}
        onLoadMore={requestTable.loadMore}
      />

      <ConfirmDialog
        open={rejectingId !== null}
        onOpenChange={(open) => !open && setRejectingId(null)}
        title={t("projects.rejectTitle")}
        description={t("projects.rejectDescription")}
        confirmLabel={t("projects.rejectConfirm")}
        onConfirm={() => rejectingId && void updateRequest(rejectingId, "REJECTED")}
      />
    </div>
  );
}
