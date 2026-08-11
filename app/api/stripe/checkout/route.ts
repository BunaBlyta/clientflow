import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';

export const runtime = 'nodejs';

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

  const invoiceId = (body as { invoiceId: string }).invoiceId;
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

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });

  if (invoice.stripeCheckoutSessionId) {
    const sessionResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${invoice.stripeCheckoutSessionId}`,
      { headers: { Authorization: `Bearer ${secretKey}` } },
    );
    if (sessionResponse.ok) {
      const session = (await sessionResponse.json()) as { url?: string };
      if (session.url) {
        return NextResponse.json({
          checkoutSessionId: invoice.stripeCheckoutSessionId,
          checkoutUrl: session.url,
        });
      }
    }
  }

  const appUrl = process.env.APP_URL ?? request.nextUrl.origin;
  const params = new URLSearchParams({
    mode: 'payment',
    success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/payment/cancelled`,
    'line_items[0][price_data][currency]': invoice.currency,
    'line_items[0][price_data][product_data][name]': invoice.description ?? 'Clientflow invoice',
    'line_items[0][price_data][unit_amount]': String(Math.round(Number(invoice.amount) * 100)),
    'line_items[0][quantity]': '1',
    'metadata[invoiceId]': invoice.id,
    'metadata[projectId]': invoice.projectId,
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
    data: { stripeCheckoutSessionId: session.id, status: 'PAYMENT_PENDING' },
  });

  return NextResponse.json({ checkoutSessionId: session.id, checkoutUrl: session.url });
}
