import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Payment received · Clientflow",
};

/**
 * Where Stripe sends the payer after a successful checkout.
 *
 * Deliberately does not read the database or the `session_id`. The Stripe
 * webhook is the only thing that marks an invoice paid, and it may not have
 * landed yet when this page renders — so this page confirms the payment was
 * *submitted*, and the invoice screens show the settled status. Claiming "paid"
 * here would be a second source of truth that could disagree with the first.
 *
 * Not behind auth: the payer arrives from Stripe, often on a mobile browser
 * with no web session.
 */
export default function PaymentSuccessPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-lg border border-border p-8 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-brand-accent/10">
          <Check className="size-5 text-brand-accent" />
        </div>

        <h1 className="mt-5 text-lg font-semibold tracking-tight">Payment received</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Thank you — your payment went through. The invoice updates to paid as soon
          as Stripe confirms it, usually within a few seconds. You can close this tab
          and head back to the app.
        </p>

        <div className="mt-6 flex justify-center">
          <Button render={<Link href="/dashboard/invoices" />}>View invoices</Button>
        </div>
      </div>
    </main>
  );
}
