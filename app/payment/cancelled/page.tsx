import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const EXPO_WEB_BASE_URL = "http://localhost:8081";

type PaymentCancelledSearchParams = Promise<{
  return_to?: string | string[];
  project_id?: string | string[];
  invoice_id?: string | string[];
}>;

function isValidIdentifier(value: string | string[] | undefined): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]+$/.test(value);
}

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
export default async function PaymentCancelledPage({
  searchParams,
}: {
  searchParams: PaymentCancelledSearchParams;
}) {
  const params = await searchParams;
  const projectId = isValidIdentifier(params.project_id) ? params.project_id : null;
  const invoiceId = isValidIdentifier(params.invoice_id) ? params.invoice_id : null;
  const isMobileReturn = params.return_to === "mobile" && projectId !== null && invoiceId !== null;
  const actionHref = isMobileReturn
    ? `${EXPO_WEB_BASE_URL}/projects/${encodeURIComponent(projectId)}/invoices`
    : "/dashboard/invoices";
  const actionLabel = isMobileReturn ? "Continue to web app" : "Back to invoices";

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
          <Button variant="secondary" nativeButton={false} render={<a href={actionHref} />}>
            {actionLabel}
          </Button>
        </div>
        {isMobileReturn && (
          <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
            This development link opens the Expo web app on port 8081. The invoice
            remains unchanged until you choose to pay it again.
          </p>
        )}
      </div>
    </main>
  );
}
