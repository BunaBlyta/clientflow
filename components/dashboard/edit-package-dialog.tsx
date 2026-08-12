"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import type { ManagedPackage } from "@/lib/types";

export function EditPackageDialog({
  pkg,
  onUpdated,
}: {
  pkg: ManagedPackage;
  onUpdated: (pkg: ManagedPackage) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/packages/${encodeURIComponent(pkg.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") || pkg.name).trim(),
          description: String(form.get("description") || pkg.description).trim(),
          price: Number(form.get("price")),
          currency: String(form.get("currency") || pkg.currency).trim().toLowerCase(),
          estimatedDuration: String(form.get("estimatedDuration") || "").trim() || null,
        }),
      });
      const result = (await response.json().catch(() => null)) as ManagedPackage | { error?: string } | null;
      if (!response.ok) {
        throw new Error(
          result && "error" in result && typeof result.error === "string"
            ? result.error
            : "We couldn't update this package.",
        );
      }
      if (!result || !("id" in result)) throw new Error("The server returned an unexpected package response.");
      onUpdated(result);
      setOpen(false);
      toast.success(`${pkg.name} updated`, {
        description: "Changes apply to the public pricing page immediately.",
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "We couldn't update this package.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil />
        Edit
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {pkg.name}</DialogTitle>
          <DialogDescription>
            Feeds both the public pricing page and internal project creation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={pkg.name} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price">Price ({pkg.currency.toUpperCase()})</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={pkg.price}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                name="currency"
                defaultValue={pkg.currency}
                maxLength={3}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="estimatedDuration">Estimated duration</Label>
            <Input
              id="estimatedDuration"
              name="estimatedDuration"
              defaultValue={pkg.estimatedDuration ?? ""}
              placeholder="6–8 weeks"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={pkg.description} rows={2} required />
          </div>
          {error && (
            <p role="alert" className="border border-status-danger/30 bg-status-danger/5 px-3 py-2.5 text-[13px] text-status-danger">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
