import { NextRequest, NextResponse } from 'next/server';
import { verifyStripeSignature } from '@/app/api/_lib/stripe';
import { markInvoiceFailed, markInvoicePaid } from '@/app/api/_lib/invoice-payments';

export const runtime = 'nodejs';

type StripeEvent = {
  type?: string;
  data?: { object?: {
    id?: string;
    object?: 'checkout.session' | 'payment_intent';
    metadata?: { invoiceId?: string; projectId?: string };
    payment_intent?: string | { id?: string } | null;
    payment_status?: 'paid' | 'unpaid' | 'no_payment_required' | null;
  } };
};

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');
  if (!secret || !signature) {
    return NextResponse.json({ error: 'Stripe signature required' }, { status: 400 });
  }

  const payload = await request.text();
  if (!verifyStripeSignature(payload, signature, secret)) {
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }

  const stripeObject = event.data?.object;
  const invoiceId = stripeObject?.metadata?.invoiceId;
  if (!invoiceId) return NextResponse.json({ received: true });

  const isPaymentIntent =
    stripeObject?.object === 'payment_intent' || event.type?.startsWith('payment_intent.');
  const checkoutSessionId = isPaymentIntent ? undefined : stripeObject?.id;
  const paymentIntentId = isPaymentIntent
    ? stripeObject?.id
    : typeof stripeObject?.payment_intent === 'string'
      ? stripeObject.payment_intent
      : stripeObject?.payment_intent?.id;

  const checkoutCompletedWithFunds =
    event.type === 'checkout.session.completed' && stripeObject?.payment_status === 'paid';
  if (
    checkoutCompletedWithFunds ||
    event.type === 'checkout.session.async_payment_succeeded' ||
    event.type === 'payment_intent.succeeded'
  ) {
    await markInvoicePaid(invoiceId, { checkoutSessionId, paymentIntentId });
  } else if (
    event.type === 'payment_intent.payment_failed' ||
    event.type === 'checkout.session.async_payment_failed' ||
    event.type === 'checkout.session.expired'
  ) {
    await markInvoiceFailed(invoiceId, { paymentIntentId });
  }

  return NextResponse.json({ received: true });
}
