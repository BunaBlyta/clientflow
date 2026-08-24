"use client";

import { useState } from "react";
import { SettingsContent } from "@/components/dashboard/settings-content";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocale } from "@/lib/i18n";
import type { SettingsTab } from "@/components/dashboard/settings-content";

type SettingsDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<SettingsTab>("packages");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="settings-dialog-content flex h-[536px] max-h-[calc(100vh-2rem)] w-[680px] !max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl p-5 sm:!max-w-[680px] sm:p-6">
        <DialogHeader className="settings-dialog-header flex-row items-start justify-between gap-4">
          <div className="min-w-0">
            <DialogTitle>{t("dashboard.settings")}</DialogTitle>
            <DialogDescription>
              {t(activeTab === "packages" ? "settings.packagesIntro" : "settings.teamIntro")}
            </DialogDescription>
          </div>
          <div data-settings-header-action className="mt-1 mr-1 shrink-0" />
        </DialogHeader>
        <div className="settings-dialog-body min-h-0 flex-1 overflow-y-auto pr-1">
          <SettingsContent activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
