"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/contact-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.get("name"),
          email: values.get("email"),
          message: values.get("message"),
        }),
      });
      const result = (await response.json().catch(() => null)) as { error?: unknown } | null;
      if (!response.ok) {
        throw new Error(typeof result?.error === "string" ? result.error : "We couldn't send your inquiry.");
      }

      form.reset();
      setSubmitted(true);
      toast.success("Inquiry sent", { description: "We'll get back to you by email shortly." });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "We couldn't send your inquiry.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section id="contact" className="border-t border-border bg-[#CAF4FF]/20">
      <div className="mx-auto max-w-xl px-4 py-20 sm:px-6">
        <h2 className="text-xl font-semibold tracking-tight sm:text-[22px]">Custom web app build</h2>
        <p className="mt-2 text-[14px] text-muted-foreground">
          Every custom build starts with a conversation. Tell us what you&apos;re building and we&apos;ll
          reach out to scope it — pricing and timeline follow from there.
        </p>

        {submitted ? (
          <div className="mt-8 rounded-lg border border-border bg-background p-6">
            <p className="text-[14px] font-medium">Thanks — your inquiry is with the studio.</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              We&apos;ll review the brief and follow up by email. You can send another inquiry anytime.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setSubmitted(false)}>
              Send another inquiry
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact-name">Your name</Label>
                <Input id="contact-name" name="name" required placeholder="Ava Marlowe" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact-email">Email</Label>
                <Input id="contact-email" name="email" type="email" required placeholder="you@company.com" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-message">What are you looking to build?</Label>
              <Textarea
                id="contact-message"
                name="message"
                required
                rows={5}
                placeholder="Tell us about the product, audience, and what you need help launching."
              />
            </div>
            {error && (
              <p role="alert" className="border border-status-danger/30 bg-status-danger/5 px-3 py-2.5 text-[13px] leading-5 text-status-danger">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending} className="mt-2 self-start">
              {pending ? "Sending…" : "Send inquiry"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
