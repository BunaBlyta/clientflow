"use client";

import { useState } from "react";
import { ChevronDown, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { patchJson } from "@/lib/api-client";
import { PROJECT_STATUS_TONE } from "@/lib/status";
import type { Project, ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

const SELECTABLE_STATUSES: ProjectStatus[] = [
  "DISCOVERY",
  "DESIGN",
  "DEVELOPMENT",
  "REVIEW",
  "LAUNCHED",
  "ON_HOLD",
  "CANCELLED",
];

export function ProjectStatusMenu({
  project,
  onProjectUpdated,
  onProjectUpdateConfirmed,
}: {
  project: Project;
  onProjectUpdated: (project: Project) => void;
  onProjectUpdateConfirmed?: () => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<ProjectStatus | null>(null);
  const { t } = useLocale();
  const isAwaitingDeposit = project.status === "PENDING" && Boolean(project.packageId);
  const displayedStatus = optimisticStatus ?? project.status;

  async function updateStatus(status: ProjectStatus) {
    setIsUpdating(true);
    setOptimisticStatus(status);
    onProjectUpdated({ ...project, status, updatedAt: new Date().toISOString() });

    try {
      const updatedProject = await patchJson<Project>(
        `/api/projects/${project.id}`,
        { status },
        t("status.updateProjectError"),
      );

      if (updatedProject.id !== project.id || updatedProject.status !== status) {
        throw new Error("The server returned an unexpected project response.");
      }

      onProjectUpdated(updatedProject);
      onProjectUpdateConfirmed?.();
      toast.success(`${t("status.projectMovedTo")} ${t(`status.project.${status}`)}.`);
    } catch (error) {
      onProjectUpdated(project);
      toast.error(error instanceof Error ? error.message : t("status.updateProjectError"));
    } finally {
      setOptimisticStatus(null);
      setIsUpdating(false);
    }
  }

  const statusControl = (
    <Button
      variant="ghost"
      size="sm"
      className="crm-status-trigger h-8 gap-1 rounded-md px-3 text-[13px] font-normal hover:opacity-100"
      disabled={isUpdating || isAwaitingDeposit}
      title={
        isAwaitingDeposit ? t("status.depositGate") : undefined
      }
    >
      <span className={PROJECT_STATUS_TONE[displayedStatus]}>
        {t(`status.project.${displayedStatus}`)}
      </span>
      {isUpdating ? (
        <LoaderCircle className="size-3 animate-spin text-brand-accent" />
      ) : (
        <ChevronDown className="size-3 text-muted-foreground" />
      )}
    </Button>
  );

  if (isAwaitingDeposit) {
    return (
      <div className="flex flex-col items-start gap-0.5">
        {statusControl}
        <span className="px-3 text-[11px] leading-tight text-muted-foreground">
          {t("status.depositGate")}
        </span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={statusControl} />
      <DropdownMenuContent align="start" className="crm-status-menu w-auto">
        {SELECTABLE_STATUSES.filter((s) => s !== "DISCOVERY" || project.status !== "PENDING").map(
          (status) => (
            <DropdownMenuItem
              key={status}
              className="crm-status-menu-item"
              disabled={status === project.status || isUpdating}
              onClick={() => void updateStatus(status)}
            >
              <span className={cn(PROJECT_STATUS_TONE[status])}>
                {t(`status.project.${status}`)}
              </span>
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
