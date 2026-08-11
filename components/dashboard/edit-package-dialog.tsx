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
import { useAppStore } from "@/lib/store";
import type { Package } from "@/lib/types";

export function EditPackageDialog({ pkg }: { pkg: Package }) {
  const updatePackage = useAppStore((s) => s.updatePackage);
  const [open, setOpen] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const price = form.get("priceCents");
    const features = String(form.get("features") ?? "")
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    updatePackage(pkg.id, {
      name: String(form.get("name") || pkg.name),
      description: String(form.get("description") || pkg.description),
      priceCents: pkg.isCustom ? null : Math.round(Number(price) * 100),
      turnaroundDays: Number(form.get("turnaroundDays")) || pkg.turnaroundDays,
      features: features.length > 0 ? features : pkg.features,
    });
    setOpen(false);
    toast.success(`${pkg.name} updated`, {
      description: "Changes apply to the public pricing page immediately.",
    });
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
              <Label htmlFor="priceCents">Price (USD)</Label>
              <Input
                id="priceCents"
                name="priceCents"
                type="number"
                min="0"
                step="1"
                defaultValue={pkg.priceCents ? pkg.priceCents / 100 : ""}
                disabled={pkg.isCustom}
                placeholder={pkg.isCustom ? "Custom pricing" : undefined}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="turnaroundDays">Turnaround (days)</Label>
              <Input
                id="turnaroundDays"
                name="turnaroundDays"
                type="number"
                min="1"
                step="1"
                defaultValue={pkg.turnaroundDays}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={pkg.description} rows={2} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="features">Features (one per line)</Label>
            <Textarea id="features" name="features" defaultValue={pkg.features.join("\n")} rows={4} />
          </div>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
