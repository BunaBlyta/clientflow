export type StripePaymentIntent = {
  id?: string;
  status?: string;
};

export type StripeCheckoutSession = {
  id?: string;
  url?: string | null;
  status?: 'open' | 'complete' | 'expired' | null;
  payment_status?: 'paid' | 'unpaid' | 'no_payment_required' | null;
  payment_intent?: string | StripePaymentIntent | null;
  success_url?: string | null;
  cancel_url?: string | null;
};

export type StripeApiResult<T> =
  | { ok: true; value: T }
  | { ok: false; status: number };

export function paymentIntentId(session: StripeCheckoutSession): string | undefined {
  if (typeof session.payment_intent === 'string') return session.payment_intent;
  return session.payment_intent?.id;
}

export async function retrieveCheckoutSession(
  sessionId: string,
  secretKey: string,
  options?: { expandPaymentIntent?: boolean },
): Promise<StripeApiResult<StripeCheckoutSession>> {
  const url = new URL(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
  );
  if (options?.expandPaymentIntent) {
    url.searchParams.set('expand[]', 'payment_intent');
  }

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!response.ok) return { ok: false, status: response.status };
    return { ok: true, value: (await response.json()) as StripeCheckoutSession };
  } catch {
    return { ok: false, status: 0 };
  }
}

export async function expireCheckoutSession(
  sessionId: string,
  secretKey: string,
): Promise<StripeApiResult<StripeCheckoutSession>> {
  try {
    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}/expire`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${secretKey}` },
      },
    );
    if (!response.ok) return { ok: false, status: response.status };
    return { ok: true, value: (await response.json()) as StripeCheckoutSession };
  } catch {
    return { ok: false, status: 0 };
  }
}
