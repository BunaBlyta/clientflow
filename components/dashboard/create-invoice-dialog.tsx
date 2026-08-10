"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import type { InvoiceKind } from "@/lib/types";

const KIND_LABEL: Record<InvoiceKind, string> = {
  DEPOSIT: "Deposit",
  FINAL: "Final payment",
  EXTRA: "Extra charge",
};

export function CreateInvoiceDialog({ projectId }: { projectId?: string }) {
  const projects = useAppStore((s) => s.projects);
  const createInvoice = useAppStore((s) => s.createInvoice);
  const [open, setOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId ?? "");
  const [kind, setKind] = useState<InvoiceKind>("EXTRA");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const amount = Number(form.get("amount"));
    const targetProjectId = projectId ?? selectedProjectId;
    if (!targetProjectId || !amount) return;
    createInvoice({
      projectId: targetProjectId,
      kind,
      label: String(form.get("label") || KIND_LABEL[kind]),
      amountCents: Math.round(amount * 100),
      dueDate: (form.get("dueDate") as string) || undefined,
      sendImmediately: true,
    });
    setOpen(false);
    e.currentTarget.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus />
        New invoice
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New invoice</DialogTitle>
          <DialogDescription>Sends immediately to the client.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!projectId && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project">Project</Label>
              <Select value={selectedProjectId} onValueChange={(v) => v && setSelectedProjectId(v)}>
                <SelectTrigger id="project" className="w-full">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kind">Type</Label>
            <Select value={kind} onValueChange={(v) => v && setKind(v as InvoiceKind)}>
              <SelectTrigger id="kind" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(KIND_LABEL) as InvoiceKind[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {KIND_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="label">Label</Label>
            <Input id="label" name="label" placeholder={KIND_LABEL[kind]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input id="amount" name="amount" type="number" min="0" step="1" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Send invoice</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
