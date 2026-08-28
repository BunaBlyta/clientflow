import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { markInvoiceFailed, markInvoicePaid } from '@/app/api/_lib/invoice-payments';
import { prisma } from '@/app/api/_lib/prisma';
import {
  expireCheckoutSession,
  paymentIntentId,
  retrieveCheckoutSession,
  type StripeCheckoutSession,
} from '@/app/api/_lib/stripe-checkout';
import { transitionInvoiceStatus, type InvoiceStatus } from '@/prisma/invoice-state';

export const runtime = 'nodejs';

type CheckoutReturnTo = 'mobile';
type CheckoutChannel = 'web' | 'mobile';

const MAX_CHECKOUT_STATE_ATTEMPTS = 6;

function isMobileReturnTo(value: unknown): value is CheckoutReturnTo {
  return value === 'mobile';
}

function checkoutChannel(returnTo: CheckoutReturnTo | undefined): CheckoutChannel {
  return returnTo === 'mobile' ? 'mobile' : 'web';
}

function channelFromAttemptId(attemptId: string): CheckoutChannel | null {
  if (attemptId.startsWith('mobile_')) return 'mobile';
  if (attemptId.startsWith('web_')) return 'web';
  return null;
}

function newAttemptId(channel: CheckoutChannel) {
  return `${channel}_${randomUUID()}`;
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

function webSuccessUrl(appUrl: string, sessionPlaceholder: string) {
  const url = new URL('/payment/success', appUrl);
  return `${url.origin}${url.pathname}?session_id=${sessionPlaceholder}`;
}

function cancelUrl(
  appUrl: string,
  channel: CheckoutChannel,
  projectId: string,
  invoiceId: string,
  attemptId: string,
) {
  const url = new URL('/api/stripe/checkout/cancel', appUrl);
  url.searchParams.set('invoice_id', invoiceId);
  url.searchParams.set('attempt_id', attemptId);
  if (channel === 'mobile') {
    url.searchParams.set('return_to', 'mobile');
    url.searchParams.set('project_id', projectId);
  }
  return url.toString();
}

function isMatchingSuccessUrl(
  successUrl: string | null | undefined,
  appUrl: string,
  channel: CheckoutChannel,
  projectId: string,
  invoiceId: string,
) {
  if (!successUrl) return false;
  try {
    const url = new URL(successUrl);
    const expectedOrigin = new URL(appUrl).origin;
    if (url.origin !== expectedOrigin || url.pathname !== '/payment/success') return false;
    if (channel === 'web') return url.searchParams.get('return_to') === null;
    return (
      url.searchParams.get('return_to') === 'mobile' &&
      url.searchParams.get('project_id') === projectId &&
      url.searchParams.get('invoice_id') === invoiceId
    );
  } catch {
    return false;
  }
}

function isMatchingCancelUrl(
  value: string | null | undefined,
  appUrl: string,
  channel: CheckoutChannel,
  projectId: string,
  invoiceId: string,
  attemptId: string,
) {
  if (!value) return false;
  try {
    const url = new URL(value);
    const expectedOrigin = new URL(appUrl).origin;
    if (
      url.origin !== expectedOrigin ||
      url.pathname !== '/api/stripe/checkout/cancel' ||
      url.searchParams.get('invoice_id') !== invoiceId ||
      url.searchParams.get('attempt_id') !== attemptId
    ) {
      return false;
    }
    if (channel === 'web') return url.searchParams.get('return_to') === null;
    return (
      url.searchParams.get('return_to') === 'mobile' &&
      url.searchParams.get('project_id') === projectId
    );
  } catch {
    return false;
  }
}

function canReuseSession(
  session: StripeCheckoutSession,
  appUrl: string,
  channel: CheckoutChannel,
  projectId: string,
  invoiceId: string,
  attemptId: string,
) {
  return (
    session.status === 'open' &&
    Boolean(session.url) &&
    isMatchingSuccessUrl(session.success_url, appUrl, channel, projectId, invoiceId) &&
    isMatchingCancelUrl(
      session.cancel_url,
      appUrl,
      channel,
      projectId,
      invoiceId,
      attemptId,
    )
  );
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

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });

  const invoiceId = values.invoiceId;
  const requestedChannel = checkoutChannel(values.returnTo as CheckoutReturnTo | undefined);
  const appUrl = process.env.APP_URL ?? request.nextUrl.origin;

  for (let stateAttempt = 0; stateAttempt < MAX_CHECKOUT_STATE_ATTEMPTS; stateAttempt += 1) {
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
        stripeCheckoutAttemptId: true,
        stripeCheckoutSessionId: true,
      },
    });

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 409 });
    }
    if (invoice.status === 'VOIDED' || invoice.status === 'REFUNDED') {
      return NextResponse.json({ error: 'Invoice cannot be paid' }, { status: 409 });
    }

    let paymentPendingStatus: InvoiceStatus;
    try {
      paymentPendingStatus = transitionInvoiceStatus(invoice.status, 'PAYMENT_PENDING');
    } catch {
      return NextResponse.json(
        { error: `Invoice cannot transition from ${invoice.status} to PAYMENT_PENDING` },
        { status: 409 },
      );
    }

    if (invoice.stripeCheckoutSessionId) {
      const retrieved = await retrieveCheckoutSession(invoice.stripeCheckoutSessionId, secretKey);
      if (!retrieved.ok) {
        return NextResponse.json(
          { error: 'Unable to verify the existing Stripe checkout session' },
          { status: 502 },
        );
      }

      const session = retrieved.value;
      if (session.payment_status === 'paid') {
        await markInvoicePaid(invoice.id, {
          checkoutSessionId: session.id ?? invoice.stripeCheckoutSessionId,
          paymentIntentId: paymentIntentId(session),
        });
        return NextResponse.json({ error: 'Invoice is already paid' }, { status: 409 });
      }

      if (session.status === 'complete') {
        return NextResponse.json({ error: 'Payment is still processing' }, { status: 409 });
      }

      const storedChannel = invoice.stripeCheckoutAttemptId
        ? channelFromAttemptId(invoice.stripeCheckoutAttemptId)
        : null;
      if (
        storedChannel === requestedChannel &&
        invoice.stripeCheckoutAttemptId &&
        canReuseSession(
          session,
          appUrl,
          storedChannel,
          invoice.projectId,
          invoice.id,
          invoice.stripeCheckoutAttemptId,
        )
      ) {
        if (invoice.status !== 'PAYMENT_PENDING') {
          await prisma.invoice.updateMany({
            where: { id: invoice.id, status: invoice.status },
            data: { status: paymentPendingStatus },
          });
        }
        return NextResponse.json({
          checkoutSessionId: invoice.stripeCheckoutSessionId,
          checkoutUrl: session.url,
        });
      }

      if (session.status === 'open') {
        const expired = await expireCheckoutSession(invoice.stripeCheckoutSessionId, secretKey);
        if (!expired.ok) {
          const latest = await retrieveCheckoutSession(invoice.stripeCheckoutSessionId, secretKey);
          if (latest.ok && latest.value.payment_status === 'paid') {
            await markInvoicePaid(invoice.id, {
              checkoutSessionId: latest.value.id ?? invoice.stripeCheckoutSessionId,
              paymentIntentId: paymentIntentId(latest.value),
            });
            return NextResponse.json({ error: 'Invoice is already paid' }, { status: 409 });
          }
          return NextResponse.json(
            { error: 'Unable to close the existing Stripe checkout session' },
            { status: 502 },
          );
        }
      } else if (session.status === 'expired' && invoice.status === 'PAYMENT_PENDING') {
        await markInvoiceFailed(invoice.id, { paymentIntentId: paymentIntentId(session) });
        continue;
      } else if (session.status !== 'expired') {
        return NextResponse.json(
          { error: 'Stripe returned an unknown checkout session state' },
          { status: 502 },
        );
      }

      const nextAttemptId = newAttemptId(requestedChannel);
      const claimed = await prisma.invoice.updateMany({
        where: {
          id: invoice.id,
          status: invoice.status,
          stripeCheckoutAttemptId: invoice.stripeCheckoutAttemptId,
          stripeCheckoutSessionId: invoice.stripeCheckoutSessionId,
        },
        data: {
          stripeCheckoutAttemptId: nextAttemptId,
          stripeCheckoutSessionId: null,
        },
      });
      if (claimed.count !== 1) continue;

      const created = await createCheckoutSession({
        invoice,
        attemptId: nextAttemptId,
        channel: requestedChannel,
        appUrl,
        secretKey,
      });
      if (!created.ok) return created.response;

      const stored = await storeCreatedSession(
        invoice.id,
        invoice.status,
        nextAttemptId,
        created.session.id,
        paymentPendingStatus,
      );
      if (!stored) continue;
      return NextResponse.json({
        checkoutSessionId: created.session.id,
        checkoutUrl: created.session.url,
      });
    }

    let attemptId = invoice.stripeCheckoutAttemptId;
    if (!attemptId) {
      const proposedAttemptId = newAttemptId(requestedChannel);
      const claimed = await prisma.invoice.updateMany({
        where: {
          id: invoice.id,
          status: invoice.status,
          stripeCheckoutAttemptId: null,
          stripeCheckoutSessionId: null,
        },
        data: { stripeCheckoutAttemptId: proposedAttemptId },
      });
      if (claimed.count !== 1) continue;
      attemptId = proposedAttemptId;
    }

    const attemptChannel = channelFromAttemptId(attemptId);
    if (!attemptChannel) {
      return NextResponse.json(
        { error: 'Invoice has an invalid Stripe checkout attempt' },
        { status: 500 },
      );
    }

    const created = await createCheckoutSession({
      invoice,
      attemptId,
      channel: attemptChannel,
      appUrl,
      secretKey,
    });
    if (!created.ok) return created.response;

    const stored = await storeCreatedSession(
      invoice.id,
      invoice.status,
      attemptId,
      created.session.id,
      paymentPendingStatus,
    );
    if (!stored || attemptChannel !== requestedChannel) continue;

    return NextResponse.json({
      checkoutSessionId: created.session.id,
      checkoutUrl: created.session.url,
    });
  }

  return NextResponse.json(
    { error: 'Checkout changed concurrently; please try again' },
    { status: 503, headers: { 'Retry-After': '1' } },
  );
}

async function createCheckoutSession({
  invoice,
  attemptId,
  channel,
  appUrl,
  secretKey,
}: {
  invoice: {
    id: string;
    projectId: string;
    description: string | null;
    amount: unknown;
    currency: string;
  };
  attemptId: string;
  channel: CheckoutChannel;
  appUrl: string;
  secretKey: string;
}): Promise<
  | { ok: true; session: { id: string; url: string } }
  | { ok: false; response: NextResponse }
> {
  const successUrl = channel === 'mobile'
    ? mobileSuccessUrl(appUrl, '{CHECKOUT_SESSION_ID}', invoice.projectId, invoice.id)
    : webSuccessUrl(appUrl, '{CHECKOUT_SESSION_ID}');
  const checkoutCancelUrl = cancelUrl(
    appUrl,
    channel,
    invoice.projectId,
    invoice.id,
    attemptId,
  );
  const params = new URLSearchParams({
    mode: 'payment',
    expires_at: String(Math.floor(Date.now() / 1000) + 30 * 60),
    success_url: successUrl,
    cancel_url: checkoutCancelUrl,
    client_reference_id: invoice.id,
    'line_items[0][price_data][currency]': invoice.currency,
    'line_items[0][price_data][product_data][name]': invoice.description ?? 'Clientflow invoice',
    'line_items[0][price_data][unit_amount]': String(Math.round(Number(invoice.amount) * 100)),
    'line_items[0][quantity]': '1',
    'metadata[invoiceId]': invoice.id,
    'metadata[projectId]': invoice.projectId,
    'payment_intent_data[metadata][invoiceId]': invoice.id,
    'payment_intent_data[metadata][projectId]': invoice.projectId,
  });

  let response: Response;
  try {
    response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': `clientflow:${invoice.id}:${attemptId}`,
      },
      body: params,
    });
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unable to create Stripe checkout session' },
        { status: 502 },
      ),
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unable to create Stripe checkout session' },
        { status: 502 },
      ),
    };
  }

  const session = (await response.json()) as { id?: string; url?: string };
  if (!session.id || !session.url) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Stripe returned an invalid checkout session' },
        { status: 502 },
      ),
    };
  }

  return { ok: true, session: { id: session.id, url: session.url } };
}

async function storeCreatedSession(
  invoiceId: string,
  currentStatus: InvoiceStatus,
  attemptId: string,
  sessionId: string,
  paymentPendingStatus: InvoiceStatus,
) {
  const stored = await prisma.invoice.updateMany({
    where: {
      id: invoiceId,
      status: currentStatus,
      stripeCheckoutAttemptId: attemptId,
      stripeCheckoutSessionId: null,
    },
    data: {
      stripeCheckoutSessionId: sessionId,
      status: paymentPendingStatus,
    },
  });
  return stored.count === 1;
}
