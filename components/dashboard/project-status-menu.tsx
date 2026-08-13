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
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE } from "@/lib/status";
import type { Project, ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

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
}: {
  project: Project;
  onProjectUpdated: (project: Project) => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isAwaitingDeposit = project.status === "PENDING" && Boolean(project.packageId);

  async function updateStatus(status: ProjectStatus) {
    setIsUpdating(true);

    try {
      const updatedProject = await patchJson<Project>(
        `/api/projects/${project.id}`,
        { status },
        "We couldn't update the project status.",
      );

      if (updatedProject.id !== project.id || updatedProject.status !== status) {
        throw new Error("The server returned an unexpected project response.");
      }

      onProjectUpdated(updatedProject);
      toast.success(`Project moved to ${PROJECT_STATUS_LABEL[status]}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't update the project status.");
    } finally {
      setIsUpdating(false);
    }
  }

  const statusControl = (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto gap-1 px-1 text-[13px] font-normal hover:opacity-70"
      disabled={isUpdating || isAwaitingDeposit}
      title={
        isAwaitingDeposit ? "Phase changes become available after the deposit is paid." : undefined
      }
    >
      <span className={PROJECT_STATUS_TONE[project.status]}>
        {PROJECT_STATUS_LABEL[project.status]}
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
        <span className="px-1 text-[11px] leading-tight text-muted-foreground">
          Phase changes become available after the deposit is paid.
        </span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={statusControl} />
      <DropdownMenuContent align="start" className="w-44">
        {SELECTABLE_STATUSES.filter((s) => s !== "DISCOVERY" || project.status !== "PENDING").map(
          (status) => (
            <DropdownMenuItem
              key={status}
              disabled={status === project.status || isUpdating}
              onClick={() => void updateStatus(status)}
            >
              <span className={cn(PROJECT_STATUS_TONE[status])}>
                {PROJECT_STATUS_LABEL[status]}
              </span>
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
