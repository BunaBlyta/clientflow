import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Payment cancelled · Clientflow",
};

/**
 * Where Stripe sends the payer if they back out of checkout.
 *
 * Nothing was charged and the invoice is untouched, so this page is reassurance
 * rather than an error. Same reasoning as the success page: no auth, no database
 * read.
 */
export default function PaymentCancelledPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-lg border border-border p-8 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted">
          <X className="size-5 text-muted-foreground" />
        </div>

        <h1 className="mt-5 text-lg font-semibold tracking-tight">Payment cancelled</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          No payment was taken and the invoice is unchanged. You can pay it whenever
          you&rsquo;re ready.
        </p>

        <div className="mt-6 flex justify-center">
          <Button variant="secondary" render={<Link href="/dashboard/invoices" />}>
            Back to invoices
          </Button>
        </div>
      </div>
    </main>
  );
}
