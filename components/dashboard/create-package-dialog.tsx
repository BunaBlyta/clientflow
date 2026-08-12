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
import { Textarea } from "@/components/ui/textarea";
import type { ManagedPackage } from "@/lib/types";

export function CreatePackageDialog({ onCreated }: { onCreated: (pkg: ManagedPackage) => void }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/packages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? "").trim(),
          slug: String(form.get("slug") ?? "").trim(),
          description: String(form.get("description") ?? "").trim(),
          price: Number(form.get("price")),
          currency: String(form.get("currency") ?? "usd").trim().toLowerCase(),
          estimatedDuration: String(form.get("estimatedDuration") ?? "").trim() || undefined,
          sortOrder: Number(form.get("sortOrder") ?? 0),
        }),
      });
      const result = (await response.json().catch(() => null)) as ManagedPackage | { error?: string } | null;
      if (!response.ok) {
        throw new Error(
          result && "error" in result && typeof result.error === "string"
            ? result.error
            : "We couldn't create this package.",
        );
      }
      if (!result || !("id" in result)) throw new Error("The server returned an unexpected package response.");
      onCreated(result);
      formElement.reset();
      setOpen(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "We couldn't create this package.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus />
        New package
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New package</DialogTitle>
          <DialogDescription>Add a package to the public pricing and request flow.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="package-name">Name</Label>
            <Input id="package-name" name="name" required placeholder="Full Website" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="package-slug">Slug</Label>
            <Input id="package-slug" name="slug" required pattern="[a-z0-9-]+" placeholder="full-website" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="package-price">Price</Label>
              <Input id="package-price" name="price" type="number" min="0.01" step="0.01" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="package-currency">Currency</Label>
              <Input id="package-currency" name="currency" defaultValue="usd" maxLength={3} required />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="package-duration">Estimated duration</Label>
            <Input id="package-duration" name="estimatedDuration" placeholder="6–8 weeks" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="package-description">Description</Label>
            <Textarea id="package-description" name="description" rows={2} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="package-sort-order">Sort order</Label>
            <Input id="package-sort-order" name="sortOrder" type="number" min="0" step="1" defaultValue="0" required />
          </div>
          {error && (
            <p role="alert" className="border border-status-danger/30 bg-status-danger/5 px-3 py-2.5 text-[13px] text-status-danger">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create package"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
