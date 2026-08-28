import { NextRequest, NextResponse } from 'next/server';
import { markInvoiceFailed, markInvoicePaid } from '@/app/api/_lib/invoice-payments';
import { prisma } from '@/app/api/_lib/prisma';
import {
  expireCheckoutSession,
  paymentIntentId,
  retrieveCheckoutSession,
} from '@/app/api/_lib/stripe-checkout';

export const runtime = 'nodejs';

function isIdentifier(value: string | null): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value);
}

function destination(request: NextRequest, kind: 'cancelled' | 'success') {
  const url = new URL(`/payment/${kind}`, request.nextUrl.origin);
  const returnTo = request.nextUrl.searchParams.get('return_to');
  const projectId = request.nextUrl.searchParams.get('project_id');
  const invoiceId = request.nextUrl.searchParams.get('invoice_id');
  if (returnTo === 'mobile' && isIdentifier(projectId) && isIdentifier(invoiceId)) {
    url.searchParams.set('return_to', 'mobile');
    url.searchParams.set('project_id', projectId);
    url.searchParams.set('invoice_id', invoiceId);
  }
  return url;
}

export async function GET(request: NextRequest) {
  const invoiceId = request.nextUrl.searchParams.get('invoice_id');
  const attemptId = request.nextUrl.searchParams.get('attempt_id');
  if (!isIdentifier(invoiceId) || !isIdentifier(attemptId)) {
    return NextResponse.redirect(destination(request, 'cancelled'));
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, stripeCheckoutAttemptId: attemptId },
    select: { id: true, status: true, stripeCheckoutSessionId: true },
  });
  if (
    !invoice ||
    invoice.status !== 'PAYMENT_PENDING' ||
    !invoice.stripeCheckoutSessionId
  ) {
    return NextResponse.redirect(destination(request, 'cancelled'));
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return NextResponse.redirect(destination(request, 'cancelled'));

  const retrieved = await retrieveCheckoutSession(invoice.stripeCheckoutSessionId, secretKey);
  if (!retrieved.ok) return NextResponse.redirect(destination(request, 'cancelled'));

  const session = retrieved.value;
  if (session.payment_status === 'paid') {
    await markInvoicePaid(invoice.id, {
      checkoutSessionId: session.id ?? invoice.stripeCheckoutSessionId,
      paymentIntentId: paymentIntentId(session),
    });
    return NextResponse.redirect(destination(request, 'success'));
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
        return NextResponse.redirect(destination(request, 'success'));
      }
      return NextResponse.redirect(destination(request, 'cancelled'));
    }
    await markInvoiceFailed(invoice.id, { paymentIntentId: paymentIntentId(expired.value) });
  } else if (session.status === 'expired') {
    await markInvoiceFailed(invoice.id, { paymentIntentId: paymentIntentId(session) });
  }

  return NextResponse.redirect(destination(request, 'cancelled'));
}
