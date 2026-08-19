"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, RefreshCw, X } from "lucide-react";
import { fetchJson } from "@/lib/fetch-json";
import { formatDate } from "@/lib/format";
import { isTableRowInteractiveTarget } from "@/lib/table-navigation";
import { TableToolbar } from "@/components/dashboard/table-toolbar";
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
import type { Client, Package, Project, ProjectRequest, ProjectStatus } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import type { EntityChangedEvent } from "@/lib/realtime-notification-store";

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
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState<ProjectStatus | "ALL">("ALL");
  const [requestSearch, setRequestSearch] = useState("");
  const [customSearch, setCustomSearch] = useState("");

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
                  {projectStatusFilter === "ALL"
                    ? t("status.filter.ALL")
                    : t(`status.project.${projectStatusFilter}`)}
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.value === "ALL" ? t("status.filter.ALL") : t(`status.project.${filter.value}`)}
                    </SelectItem>
                  ))}
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
}: {
  search: string;
  statusFilter: ProjectStatus | "ALL";
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const [projectsResponse, clientsResponse] = await Promise.all([
        fetch("/api/projects", { credentials: "include", signal }),
        fetch("/api/clients", { credentials: "include", signal }),
      ]);

      if (!projectsResponse.ok) {
        const body = (await projectsResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "We couldn't load the projects.");
      }
      if (!clientsResponse.ok) {
        const body = (await clientsResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "We couldn't load the client list.");
      }

      const [projectData, clientData] = (await Promise.all([
        projectsResponse.json(),
        clientsResponse.json(),
      ])) as [Project[], Client[]];
      if (!Array.isArray(projectData) || !Array.isArray(clientData)) {
        throw new Error("The server returned an unexpected project response.");
      }

      if (!signal?.aborted) {
        setProjects(projectData);
        setClients(clientData);
      }
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
      if (!signal?.aborted) {
        setError(caughtError instanceof Error ? caughtError.message : "We couldn't load the projects.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadProjects(controller.signal));
    return () => controller.abort();
  }, [loadProjects]);

  useEffect(() => {
    const handleEntityChanged = (event: Event) => {
      const detail = (event as CustomEvent<EntityChangedEvent>).detail;
      if (detail?.entity === "project") void loadProjects();
    };
    window.addEventListener("clientflow:entity-changed", handleEntityChanged);
    return () => window.removeEventListener("clientflow:entity-changed", handleEntityChanged);
  }, [loadProjects]);

  const clientNames = useMemo(
    () => new Map(clients.map((client) => [client.id, client.companyName])),
    [clients],
  );

  const filtered = useMemo(() => {
    return projects
      .filter((p) => statusFilter === "ALL" || p.status === statusFilter)
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [projects, search, statusFilter]);

  const handleProjectUpdated = useCallback((updatedProject: Project) => {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === updatedProject.id ? updatedProject : project,
      ),
    );
  }, []);

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
        <Button className="mt-4" variant="outline" size="sm" onClick={() => void loadProjects()}>
          <RefreshCw />
          {t("common.tryAgain")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">{t("projects.project")}</th>
              <th className="px-4 py-2.5 font-normal">{t("projects.client")}</th>
              <th className="px-4 py-2.5 font-normal">{t("projects.package")}</th>
              <th className="px-4 py-2.5 font-normal">{t("common.status")}</th>
              <th className="px-4 py-2.5 text-right font-normal">{t("projects.updated")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((project) => {
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
                    {clientNames.get(project.clientId) ?? t("common.unknown")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{packageLabel}</td>
                  <td className="px-4 py-3">
                    <ProjectStatusMenu
                      project={project}
                      onProjectUpdated={handleProjectUpdated}
                    />
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatDate(project.updatedAt)}
                  </td>
                </tr>
              );
            })}
            {projects.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <p className="text-[13px] font-medium">{t("projects.noProjects")}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">{t("projects.noProjectsIntro")}</p>
                </td>
              </tr>
            )}
            {projects.length > 0 && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  {t("projects.noMatch")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RequestsTable({ search }: { search: string }) {
  const router = useRouter();
  const { t } = useLocale();
  const [projectRequests, setProjectRequests] = useState<ProjectRequest[]>([]);
  const [packages, setPackages] = useState<Pick<Package, "id" | "name">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const loadRequests = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const [requestData, packageData] = await Promise.all([
        fetchJson<ProjectRequest[]>("/api/requests", "We couldn't load project requests.", signal),
        fetchJson<Pick<Package, "id" | "name">[]>("/api/packages", "We couldn't load packages.", signal),
      ]);
      if (!Array.isArray(requestData) || !Array.isArray(packageData)) {
        throw new Error("The server returned an unexpected request response.");
      }
      if (!signal?.aborted) {
        setProjectRequests(requestData);
        setPackages(packageData);
      }
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
      if (!signal?.aborted) {
        setError(caughtError instanceof Error ? caughtError.message : "We couldn't load project requests.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadRequests(controller.signal));
    return () => controller.abort();
  }, [loadRequests]);

  const updateRequest = useCallback(async (requestId: string, status: "APPROVED" | "REJECTED") => {
    setUpdatingId(requestId);
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
        currentRequests.map((request) => (request.id === updatedRequest.id ? updatedRequest : request)),
      );
      setRejectingId(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "We couldn't update this request.");
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const filtered = useMemo(() => {
    return [...projectRequests]
      .filter(
        (r) =>
          r.prospectName.toLowerCase().includes(search.toLowerCase()) ||
          (r.companyName ?? "").toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [projectRequests, search]);

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
        <Button className="mt-4" variant="outline" size="sm" onClick={() => void loadRequests()}>
          <RefreshCw />
          {t("common.tryAgain")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-[13px]">
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
            {filtered.map((r) => {
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
                    {packageNames.get(r.packageId) ?? "Unknown package"}
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
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(r.createdAt)}</td>
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
                        {r.reviewedAt && formatDate(r.reviewedAt)}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  {t("projects.noRequests")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
