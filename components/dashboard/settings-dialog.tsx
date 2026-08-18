"use client";

import { SettingsContent } from "@/components/dashboard/settings-content";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocale } from "@/lib/i18n";

type SettingsDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { t } = useLocale();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[600px] max-h-[calc(100vh-2rem)] w-[680px] !max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl p-5 sm:!max-w-[680px] sm:p-6">
        <DialogHeader>
          <DialogTitle>{t("dashboard.settings")}</DialogTitle>
          <DialogDescription>{t("dashboard.settingsIntro")}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <SettingsContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}
