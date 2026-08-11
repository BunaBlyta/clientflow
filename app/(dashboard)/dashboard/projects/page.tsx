"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, LoaderCircle, RefreshCw, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getPackage } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import { REQUEST_STATUS_LABEL } from "@/lib/status";
import { TableToolbar } from "@/components/dashboard/table-toolbar";
import { ProjectStatusMenu } from "@/components/dashboard/project-status-menu";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Client, Project, ProjectStatus } from "@/lib/types";

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
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "requests" ? "requests" : "projects";
  const [tab, setTab] = useState(defaultTab);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-[22px]">Projects</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Every active engagement, and incoming requests waiting on a decision.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="projects" className="mt-4">
          <ProjectsTable />
        </TabsContent>
        <TabsContent value="requests" className="mt-4">
          <RequestsTable />
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

function ProjectsTable() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "ALL">("ALL");

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
          Loading projects…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center border border-status-danger/30 px-6 text-center">
        <p className="text-[13px] font-medium text-status-danger">Projects couldn&apos;t load</p>
        <p className="mt-1 max-w-sm text-[12px] text-muted-foreground">{error}</p>
        <Button className="mt-4" variant="outline" size="sm" onClick={() => void loadProjects()}>
          <RefreshCw />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <TableToolbar search={search} onSearchChange={setSearch} placeholder="Search projects...">
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v as ProjectStatus | "ALL")}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableToolbar>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">Project</th>
              <th className="px-4 py-2.5 font-normal">Client</th>
              <th className="px-4 py-2.5 font-normal">Package</th>
              <th className="px-4 py-2.5 font-normal">Status</th>
              <th className="px-4 py-2.5 text-right font-normal">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((project) => {
              const packageLabel = project.packageId
                ? project.packageId
                    .replace(/^pkg-/, "")
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")
                : "Custom project";
              return (
                <tr key={project.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/projects/${project.id}`} className="font-medium hover:text-brand-accent">
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {clientNames.get(project.clientId) ?? "Unknown client"}
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
                  <p className="text-[13px] font-medium">No projects yet</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Approved client work will appear here.
                  </p>
                </td>
              </tr>
            )}
            {projects.length > 0 && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No projects match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RequestsTable() {
  const projectRequests = useAppStore((s) => s.projectRequests);
  const approveRequest = useAppStore((s) => s.approveRequest);
  const rejectRequest = useAppStore((s) => s.rejectRequest);
  const [search, setSearch] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return [...projectRequests]
      .filter(
        (r) =>
          r.prospectName.toLowerCase().includes(search.toLowerCase()) ||
          (r.companyName ?? "").toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [projectRequests, search]);

  return (
    <div className="flex flex-col gap-4">
      <TableToolbar search={search} onSearchChange={setSearch} placeholder="Search requests..." />

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">Prospect</th>
              <th className="px-4 py-2.5 font-normal">Package</th>
              <th className="px-4 py-2.5 font-normal">Status</th>
              <th className="px-4 py-2.5 font-normal">Submitted</th>
              <th className="px-4 py-2.5 text-right font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const pkg = getPackage(r.packageId);
              return (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.prospectName}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {r.companyName ?? r.prospectEmail}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{pkg?.name}</td>
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
                      {REQUEST_STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    {r.status === "PENDING" ? (
                      <div className="flex justify-end gap-1.5">
                        <Button size="icon-sm" variant="outline" onClick={() => approveRequest(r.id)}>
                          <Check className="text-status-success" />
                        </Button>
                        <Button size="icon-sm" variant="outline" onClick={() => setRejectingId(r.id)}>
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
                  No requests match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={rejectingId !== null}
        onOpenChange={(open) => !open && setRejectingId(null)}
        title="Reject this request?"
        description="The prospect will be notified. No client or project record is created — this can't be undone."
        confirmLabel="Reject request"
        onConfirm={() => rejectingId && rejectRequest(rejectingId)}
      />
    </div>
  );
}
