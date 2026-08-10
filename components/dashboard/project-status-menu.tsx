"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/lib/store";
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

export function ProjectStatusMenu({ project }: { project: Project }) {
  const updateProjectStatus = useAppStore((s) => s.updateProjectStatus);
  const isAwaitingDeposit = project.status === "PENDING";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-1 text-[13px] hover:opacity-70"
          />
        }
      >
        <span className={PROJECT_STATUS_TONE[project.status]}>
          {PROJECT_STATUS_LABEL[project.status]}
        </span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {isAwaitingDeposit && (
          <p className="px-2 py-1.5 text-[12px] text-muted-foreground">
            Moves to Discovery automatically once the deposit is paid.
          </p>
        )}
        {SELECTABLE_STATUSES.filter((s) => s !== "DISCOVERY" || !isAwaitingDeposit).map(
          (status) => (
            <DropdownMenuItem
              key={status}
              disabled={status === project.status}
              onClick={() => updateProjectStatus(project.id, status)}
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
