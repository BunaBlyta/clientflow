import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const EXPO_WEB_BASE_URL = "http://localhost:8081";

export const metadata = {
  title: "Payment submitted · Clientflow",
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
  project_id?: string | string[];
  invoice_id?: string | string[];
}>;

function isValidIdentifier(value: string | string[] | undefined): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]+$/.test(value);
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: PaymentSuccessSearchParams;
}) {
  const params = await searchParams;
  const projectId = isValidIdentifier(params.project_id) ? params.project_id : null;
  const invoiceId = isValidIdentifier(params.invoice_id) ? params.invoice_id : null;
  const isMobileReturn = params.return_to === "mobile" && projectId !== null && invoiceId !== null;
  const actionHref = isMobileReturn
    ? `${EXPO_WEB_BASE_URL}/projects/${encodeURIComponent(projectId)}/invoices/${encodeURIComponent(invoiceId)}/checkout`
    : "/dashboard/invoices";
  const actionLabel = isMobileReturn ? "Continue to web app" : "View invoices";

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-lg border border-border p-8 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-brand-accent/10">
          <Check className="size-5 text-brand-accent" />
        </div>

        <h1 className="mt-5 text-lg font-semibold tracking-tight">Payment submitted</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Thank you — Stripe received your payment submission. The invoice updates to
          paid only after Stripe confirms it, usually within a few seconds. You can
          close this tab and head back to the app.
        </p>

        <div className="mt-6 flex justify-center">
          <Button nativeButton={false} render={<a href={actionHref} />}>
            {actionLabel}
          </Button>
        </div>
        {isMobileReturn && (
          <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
            This development link opens the Expo web app on port 8081. Native app
            return links are deferred until native builds are available.
          </p>
        )}
      </div>
    </main>
  );
}
