"use client";

import { useState } from "react";
import { LoaderCircle, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { fetchJson } from "@/lib/fetch-json";
import { formatDate } from "@/lib/format";
import type { CustomLead } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ConvertCustomLeadDialog({
  lead,
  onConverted,
}: {
  lead: CustomLead;
  onConverted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [projectName, setProjectName] = useState(`Custom build — ${lead.name}`);
  const [description, setDescription] = useState(lead.message);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [sendInvoice, setSendInvoice] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const result = await fetchJson<{ emailSent: boolean | null }>(
        `/api/contact-leads/${encodeURIComponent(lead.id)}/convert`,
        "We couldn't create the custom project.",
        undefined,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName,
            projectName,
            description,
            amount,
            currency: "usd",
            dueDate: dueDate || undefined,
            sendInvoice,
          }),
        },
      );
      setOpen(false);
      onConverted();
      toast.success("Custom project created", {
        description:
          result.emailSent === false
            ? "The project was created, but the invitation email failed. Resend it from Clients."
            : result.emailSent === true
              ? sendInvoice
                ? "The client was invited and the custom invoice was sent."
                : "The client was invited and the invoice is saved as a draft."
              : sendInvoice
                ? "The custom project and invoice were created for the existing client."
                : "The custom project and draft invoice were created for the existing client.",
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "We couldn't create the custom project.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <WandSparkles />
        Create project
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Turn inquiry into a project</DialogTitle>
          <DialogDescription>
            This creates or uses a client account, a custom project, and a one-off invoice for {lead.email}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`company-${lead.id}`}>Company</Label>
              <Input id={`company-${lead.id}`} value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Company name" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Contact</Label>
              <p className="h-8 truncate border border-input px-2.5 py-1.5 text-[12px] text-muted-foreground">{lead.name} · {lead.email}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`project-${lead.id}`}>Project name</Label>
            <Input id={`project-${lead.id}`} value={projectName} onChange={(event) => setProjectName(event.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`description-${lead.id}`}>Project brief</Label>
            <Textarea id={`description-${lead.id}`} value={description} onChange={(event) => setDescription(event.target.value)} rows={4} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`amount-${lead.id}`}>Invoice amount (USD)</Label>
              <Input id={`amount-${lead.id}`} value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0.01" step="0.01" required placeholder="15000" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`due-${lead.id}`}>Due date</Label>
              <Input id={`due-${lead.id}`} value={dueDate} onChange={(event) => setDueDate(event.target.value)} type="date" />
            </div>
          </div>
          <label className="flex items-start gap-2 text-[13px]">
            <Checkbox checked={sendInvoice} onCheckedChange={(checked) => setSendInvoice(checked === true)} />
            <span>
              <span className="block font-medium">Send invoice now</span>
              <span className="block text-[12px] text-muted-foreground">If unchecked, the invoice stays in Draft for later review.</span>
            </span>
          </label>
          <p className="text-[11px] text-muted-foreground">Inquiry received {formatDate(lead.createdAt)}.</p>
          {error && <p role="alert" className="border border-status-danger/30 bg-status-danger/5 px-3 py-2.5 text-[13px] text-status-danger">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <LoaderCircle className="animate-spin" />}
              {pending ? "Creating…" : "Create custom project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
