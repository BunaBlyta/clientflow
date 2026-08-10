"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getClient, getPackage } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE, REQUEST_STATUS_LABEL } from "@/lib/status";
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
import type { ProjectStatus } from "@/lib/types";

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
  const projects = useAppStore((s) => s.projects);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "ALL">("ALL");

  const filtered = useMemo(() => {
    return projects
      .filter((p) => statusFilter === "ALL" || p.status === statusFilter)
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [projects, search, statusFilter]);

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
              const client = getClient(project.clientId);
              const pkg = getPackage(project.packageId);
              return (
                <tr key={project.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/projects/${project.id}`} className="font-medium hover:text-brand-accent">
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{client?.companyName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{pkg?.name}</td>
                  <td className="px-4 py-3">
                    <ProjectStatusMenu project={project} />
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatDate(project.updatedAt)}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
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
