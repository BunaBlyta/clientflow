import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { transitionInvoiceStatus } from '@/prisma/invoice-state';

export const runtime = 'nodejs';

type CheckoutReturnTo = 'mobile';

type StripeCheckoutSession = {
  url?: string;
  success_url?: string | null;
  cancel_url?: string | null;
};

function isMobileReturnTo(value: unknown): value is CheckoutReturnTo {
  return value === 'mobile';
}

function mobileSuccessUrl(
  appUrl: string,
  sessionPlaceholder: string,
  projectId: string,
  invoiceId: string,
) {
  const url = new URL('/payment/success', appUrl);

  return `${url.origin}${url.pathname}?session_id=${sessionPlaceholder}&return_to=mobile&project_id=${encodeURIComponent(projectId)}&invoice_id=${encodeURIComponent(invoiceId)}`;
}

function mobileCancelUrl(appUrl: string, projectId: string, invoiceId: string) {
  const url = new URL('/payment/cancelled', appUrl);

  return `${url.origin}${url.pathname}?return_to=mobile&project_id=${encodeURIComponent(projectId)}&invoice_id=${encodeURIComponent(invoiceId)}`;
}

function isMatchingMobileSuccessUrl(
  successUrl: string | null | undefined,
  appUrl: string,
  projectId: string,
  invoiceId: string,
) {
  if (!successUrl) return false;

  try {
    const url = new URL(successUrl);
    const expectedOrigin = new URL(appUrl).origin;
    return (
      url.origin === expectedOrigin &&
      url.pathname === '/payment/success' &&
      url.searchParams.get('return_to') === 'mobile' &&
      url.searchParams.get('project_id') === projectId &&
      url.searchParams.get('invoice_id') === invoiceId
    );
  } catch {
    return false;
  }
}

function isMatchingMobileCancelUrl(
  cancelUrl: string | null | undefined,
  appUrl: string,
  projectId: string,
  invoiceId: string,
) {
  if (!cancelUrl) return false;

  try {
    const url = new URL(cancelUrl);
    const expectedOrigin = new URL(appUrl).origin;
    return (
      url.origin === expectedOrigin &&
      url.pathname === '/payment/cancelled' &&
      url.searchParams.get('return_to') === 'mobile' &&
      url.searchParams.get('project_id') === projectId &&
      url.searchParams.get('invoice_id') === invoiceId
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || typeof (body as { invoiceId?: unknown }).invoiceId !== 'string') {
    return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
  }

  const values = body as { invoiceId: string; returnTo?: unknown };
  if (values.returnTo !== undefined && !isMobileReturnTo(values.returnTo)) {
    return NextResponse.json({ error: 'returnTo must be "mobile" when provided' }, { status: 400 });
  }

  const invoiceId = values.invoiceId;
  const returnTo = values.returnTo as CheckoutReturnTo | undefined;
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      ...(user.role === 'CLIENT' ? { client: { userId: user.id } } : {}),
    },
    select: {
      id: true,
      projectId: true,
      description: true,
      amount: true,
      currency: true,
      status: true,
      stripeCheckoutSessionId: true,
    },
  });

  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  if (invoice.status === 'PAID') {
    return NextResponse.json({ error: 'Invoice is already paid' }, { status: 409 });
  }
  if (['VOIDED', 'REFUNDED'].includes(invoice.status)) {
    return NextResponse.json({ error: 'Invoice cannot be paid' }, { status: 409 });
  }

  let paymentPendingStatus;
  try {
    paymentPendingStatus = transitionInvoiceStatus(invoice.status, 'PAYMENT_PENDING');
  } catch {
    return NextResponse.json(
      { error: `Invoice cannot transition from ${invoice.status} to PAYMENT_PENDING` },
      { status: 409 },
    );
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });

  const appUrl = process.env.APP_URL ?? request.nextUrl.origin;
  const successUrl = returnTo === 'mobile'
    ? mobileSuccessUrl(appUrl, '{CHECKOUT_SESSION_ID}', invoice.projectId, invoice.id)
    : `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = returnTo === 'mobile'
    ? mobileCancelUrl(appUrl, invoice.projectId, invoice.id)
    : `${appUrl}/payment/cancelled`;

  if (invoice.stripeCheckoutSessionId) {
    const sessionResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${invoice.stripeCheckoutSessionId}`,
      { headers: { Authorization: `Bearer ${secretKey}` } },
    );
    if (sessionResponse.ok) {
      const session = (await sessionResponse.json()) as StripeCheckoutSession;
      const canReuse = returnTo !== 'mobile' || (
        isMatchingMobileSuccessUrl(
          session.success_url,
          appUrl,
          invoice.projectId,
          invoice.id,
        ) &&
        isMatchingMobileCancelUrl(
          session.cancel_url,
          appUrl,
          invoice.projectId,
          invoice.id,
        )
      );
      if (session.url && canReuse) {
        if (invoice.status !== 'PAYMENT_PENDING') {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: paymentPendingStatus },
          });
        }
        return NextResponse.json({
          checkoutSessionId: invoice.stripeCheckoutSessionId,
          checkoutUrl: session.url,
        });
      }
    }
  }

  const params = new URLSearchParams({
    mode: 'payment',
    expires_at: String(Math.floor(Date.now() / 1000) + 30 * 60),
    success_url: successUrl,
    cancel_url: cancelUrl,
    'line_items[0][price_data][currency]': invoice.currency,
    'line_items[0][price_data][product_data][name]': invoice.description ?? 'Clientflow invoice',
    'line_items[0][price_data][unit_amount]': String(Math.round(Number(invoice.amount) * 100)),
    'line_items[0][quantity]': '1',
    'metadata[invoiceId]': invoice.id,
    'metadata[projectId]': invoice.projectId,
    'payment_intent_data[metadata][invoiceId]': invoice.id,
    'payment_intent_data[metadata][projectId]': invoice.projectId,
  });

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Unable to create Stripe checkout session' }, { status: 502 });
  }

  const session = (await response.json()) as { id?: string; url?: string };
  if (!session.id || !session.url) {
    return NextResponse.json({ error: 'Stripe returned an invalid checkout session' }, { status: 502 });
  }

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { stripeCheckoutSessionId: session.id, status: paymentPendingStatus },
  });

  return NextResponse.json({ checkoutSessionId: session.id, checkoutUrl: session.url });
}
