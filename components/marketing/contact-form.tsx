"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";

export function ContactForm() {
  const submitContactLead = useAppStore((s) => s.submitContactLead);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    submitContactLead({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      companyName: (form.get("companyName") as string) || undefined,
      message: String(form.get("message") ?? ""),
    });
    e.currentTarget.reset();
    setSubmitted(true);
    toast.success("Message sent", { description: "We'll get back to you to talk scope and pricing." });
  }

  return (
    <section id="contact" className="border-t border-border">
      <div className="mx-auto max-w-xl px-4 py-20 sm:px-6">
        <h2 className="text-xl font-semibold tracking-tight sm:text-[22px]">Custom web app build</h2>
        <p className="mt-2 text-[14px] text-muted-foreground">
          Every custom build starts with a conversation. Tell us what you&apos;re building and we&apos;ll
          reach out to scope it — pricing and timeline follow from there.
        </p>

        {submitted ? (
          <div className="mt-8 rounded-lg border border-border bg-secondary/40 p-6">
            <p className="text-[14px] font-medium">Thanks — message sent.</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              We&apos;ll follow up by email to set up a scoping call.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setSubmitted(false)}>
              Send another message
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact-name">Your name</Label>
                <Input id="contact-name" name="name" required placeholder="Renata Souza" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact-company">Company (optional)</Label>
                <Input id="contact-company" name="companyName" placeholder="Fieldnote" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-email">Email</Label>
              <Input id="contact-email" name="email" type="email" required placeholder="you@company.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-message">What are you building?</Label>
              <Textarea
                id="contact-message"
                name="message"
                rows={5}
                required
                placeholder="A custom web app for..."
              />
            </div>
            <Button type="submit" className="mt-2">
              Send message
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
