// ============================================================
// Stripe REST helper — Klarna checkout.
//
// Deliberately no SDK: Stripe's API is form-encoded HTTP, and a fetch
// wrapper keeps the function cold-start small and the dependency
// surface at zero. Mirrors the shape of _shared/revolut.ts.
//
// Env:
//   STRIPE_SECRET_KEY   sk_live_… / sk_test_…
//   STRIPE_API_BASE     optional override (default https://api.stripe.com)
//
// Revolut stays the card / Apple Pay / Google Pay / Pay-by-Bank path.
// This module exists ONLY to add Klarna alongside it, so nothing here
// should grow into a general-purpose payments client.
// ============================================================

const API_BASE = Deno.env.get('STRIPE_API_BASE') ?? 'https://api.stripe.com';

export function stripeConfigured(): boolean {
  const k = Deno.env.get('STRIPE_SECRET_KEY');
  return typeof k === 'string' && k.startsWith('sk_');
}

function secret(): string {
  const k = Deno.env.get('STRIPE_SECRET_KEY');
  if (!k) throw new Error('STRIPE_SECRET_KEY is not set.');
  return k;
}

/** Euros → cents. Stripe amounts are integer minor units. */
export function eurosToMinor(eur: number): number {
  return Math.round(eur * 100);
}

/** Stripe takes form-encoded bodies with bracket notation for nested
 *  values (line_items[0][price_data][currency]=eur). */
function encode(obj: Record<string, unknown>, prefix = ''): string[] {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item !== null && typeof item === 'object') {
          parts.push(...encode(item as Record<string, unknown>, `${key}[${i}]`));
        } else {
          parts.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else if (typeof v === 'object') {
      parts.push(...encode(v as Record<string, unknown>, key));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts;
}

export interface CheckoutSession {
  id: string;
  url: string;
  payment_status: string;
  status: string;
  amount_total: number | null;
  currency: string | null;
  metadata?: Record<string, string>;
}

export interface CreateSessionInput {
  amountEur: number;
  description: string;
  successUrl: string;
  cancelUrl: string;
  buyerEmail?: string;
  clientReferenceId?: string;
  metadata?: Record<string, string>;
  /** Idempotency key so a double-submit cannot create two sessions. */
  idempotencyKey?: string;
}

/** Creates a Klarna-only Checkout Session.
 *
 *  payment_method_types is pinned to ['klarna'] on purpose: this is the
 *  Klarna button, sitting next to the existing Revolut button. Widening
 *  it to cards here would silently give ÉIRVOX two card processors and
 *  two reconciliation surfaces. */
export async function createKlarnaSession(input: CreateSessionInput): Promise<CheckoutSession> {
  const body: Record<string, unknown> = {
    mode: 'payment',
    'payment_method_types': ['klarna'],
    // Klarna underwrites per country, so Stripe requires a billing address.
    billing_address_collection: 'required',
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: eurosToMinor(input.amountEur),
        product_data: { name: input.description.slice(0, 250) },
      },
    }],
  };
  if (input.buyerEmail) body.customer_email = input.buyerEmail;
  if (input.clientReferenceId) body.client_reference_id = input.clientReferenceId.slice(0, 200);
  if (input.metadata) body.metadata = input.metadata;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${secret()}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (input.idempotencyKey) headers['Idempotency-Key'] = input.idempotencyKey;

  const res = await fetch(`${API_BASE}/v1/checkout/sessions`, {
    method: 'POST',
    headers,
    body: encode(body).join('&'),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message ?? `Stripe returned ${res.status}`;
    throw new Error(String(msg).slice(0, 280));
  }
  return json as CheckoutSession;
}

/** Reads a session back. Used by the return page to show a real state
 *  rather than trusting the redirect. */
export async function getSession(id: string): Promise<CheckoutSession> {
  const res = await fetch(`${API_BASE}/v1/checkout/sessions/${encodeURIComponent(id)}`, {
    headers: { 'Authorization': `Bearer ${secret()}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message ?? `Stripe returned ${res.status}`;
    throw new Error(String(msg).slice(0, 280));
  }
  return json as CheckoutSession;
}

/** Verifies a `stripe-signature` header against the raw body.
 *  HMAC-SHA256 over `${timestamp}.${rawBody}`, constant-time compared,
 *  with a replay window. Same shape as the Revolut webhook's check. */
export async function verifyWebhook(
  rawBody: string,
  signatureHeader: string | null,
  toleranceSeconds = 300,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const whsec = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!whsec) return { ok: false, reason: 'secret_not_configured' };
  if (!signatureHeader) return { ok: false, reason: 'missing_signature_header' };

  let timestamp = '';
  const provided: string[] = [];
  for (const part of signatureHeader.split(',')) {
    const [k, v] = part.split('=', 2);
    if (k?.trim() === 't') timestamp = (v ?? '').trim();
    if (k?.trim() === 'v1') provided.push((v ?? '').trim());
  }
  if (!timestamp || provided.length === 0) return { ok: false, reason: 'malformed_signature_header' };

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSeconds) return { ok: false, reason: 'timestamp_outside_tolerance' };

  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(whsec),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${rawBody}`));
  const expected = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

  for (const candidate of provided) {
    if (candidate.length !== expected.length) continue;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ candidate.charCodeAt(i);
    if (diff === 0) return { ok: true };
  }
  return { ok: false, reason: 'signature_mismatch' };
}
