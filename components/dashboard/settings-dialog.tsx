"use client";

import { Settings } from "lucide-react";
import { SettingsContent } from "@/components/dashboard/settings-content";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLocale } from "@/lib/i18n";

export function SettingsDialog() {
  const { t } = useLocale();
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" className="w-full justify-start gap-2 px-2" />}>
        <Settings className="size-4" />
        {t("dashboard.settings")}
      </DialogTrigger>
      <DialogContent className="flex h-[min(680px,calc(100vh-2rem))] max-h-[calc(100vh-2rem)] max-w-2xl flex-col overflow-hidden rounded-2xl p-5 sm:p-6">
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
