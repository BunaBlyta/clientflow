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

export function SettingsDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" className="w-full justify-start gap-2 px-2" />}>
        <Settings className="size-4" />
        Settings
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage service packages and your team.</DialogDescription>
        </DialogHeader>
        <SettingsContent />
      </DialogContent>
    </Dialog>
  );
}
