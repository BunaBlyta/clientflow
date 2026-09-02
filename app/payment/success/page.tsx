import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocaleText } from "@/components/locale-text";

export const metadata = {
  title: "Payment submitted",
  robots: { index: false, follow: false },
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
type PaymentSuccessSearchParams = Promise<{
  return_to?: string | string[];
}>;

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: PaymentSuccessSearchParams;
}) {
  const params = await searchParams;
  const isMobileReturn = params.return_to === "mobile";

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-lg border border-border p-8 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-brand-accent/10">
          <Check className="size-5 text-brand-accent" />
        </div>

        {isMobileReturn ? (
          <h1 className="mt-5 text-lg font-semibold tracking-tight">
            <LocaleText id="payment.returnToApp" />
          </h1>
        ) : (
          <>
            <h1 className="mt-5 text-lg font-semibold tracking-tight">
              <LocaleText id="payment.submitted" />
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              <LocaleText id="payment.submittedIntro" />
            </p>
            <div className="mt-6 flex justify-center">
              <Button nativeButton={false} render={<a href="/dashboard/invoices" />}>
                <LocaleText id="payment.viewInvoices" />
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
