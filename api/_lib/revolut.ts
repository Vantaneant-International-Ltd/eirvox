// ============================================================
// ÉIRVOX — Revolut Merchant API client (server-only)
// ============================================================
//
// Wraps a small subset of https://developer.revolut.com/docs/merchant
// for the v1 hosted-checkout flow:
//
//   createOrder  -> POST /1.0/orders
//   getOrder     -> GET  /1.0/orders/:id
//
// Hosted checkout flow:
//   1. server creates an order (this client)
//   2. server returns the checkout_url to the browser
//   3. browser redirects to checkout_url, buyer pays on Revolut's host
//   4. Revolut redirects browser back to redirect_url with order id
//   5. our return page fetches order status to confirm
//
// Env vars (server-only, NO VITE_ prefix):
//   REVOLUT_API_KEY      sk_... (live) or sk_sandbox_... (sandbox)
//   REVOLUT_API_BASE     https://merchant.revolut.com/api (live)
//                        https://sandbox-merchant.revolut.com/api (sandbox)
//   REVOLUT_API_VERSION  date string, e.g. 2024-09-01
// ============================================================

const API_KEY = process.env.REVOLUT_API_KEY;
const API_BASE = process.env.REVOLUT_API_BASE ?? 'https://merchant.revolut.com/api';
const API_VERSION = process.env.REVOLUT_API_VERSION ?? '2024-09-01';

function requireKey(): string {
  if (!API_KEY) {
    throw new Error('REVOLUT_API_KEY missing. Set in .env locally and Vercel project env in prod.');
  }
  return API_KEY;
}

/** Revolut amounts are integer minor units (cents). 100 = €1.00. */
export function eurosToMinor(euros: number): number {
  return Math.round(euros * 100);
}

export function minorToEuros(minor: number): number {
  return minor / 100;
}

export interface CreateOrderInput {
  /** Amount in minor units (cents). 100 = €1.00 */
  amount: number;
  /** ISO 4217 code. EUR for v1. */
  currency?: string;
  /** Visible to the buyer on the Revolut checkout page. */
  description?: string;
  /** Free-form reference you choose; useful for reconciliation. */
  merchant_order_ext_ref?: string;
  /** Absolute URL Revolut redirects the buyer to after pay/cancel. */
  redirect_url?: string;
  /** Optional metadata (string->string), surfaced in webhooks/admin. */
  metadata?: Record<string, string>;
  /** AUTOMATIC = funds captured immediately on auth. MANUAL = auth-only,
   *  capture later via POST /orders/:id/capture. Default AUTOMATIC. */
  capture_mode?: 'AUTOMATIC' | 'MANUAL';
}

export interface RevolutOrder {
  id: string;
  token?: string;
  type?: string;
  state: 'PENDING' | 'PROCESSING' | 'AUTHORISED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  created_at: string;
  updated_at: string;
  amount: number;
  currency: string;
  capture_mode?: string;
  checkout_url?: string;
  merchant_order_ext_ref?: string;
  metadata?: Record<string, string>;
}

async function revolutFetch(path: string, init: RequestInit): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${requireKey()}`,
      'Revolut-Api-Version': API_VERSION,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  if (!res.ok) {
    // Surface the Revolut error body verbatim so the caller can log it.
    throw new Error(`Revolut ${init.method ?? 'GET'} ${path} -> ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

export async function createOrder(input: CreateOrderInput): Promise<RevolutOrder> {
  const body = {
    amount: input.amount,
    currency: input.currency ?? 'EUR',
    capture_mode: input.capture_mode ?? 'AUTOMATIC',
    description: input.description,
    merchant_order_ext_ref: input.merchant_order_ext_ref,
    redirect_url: input.redirect_url,
    metadata: input.metadata,
  };

  return await revolutFetch('/1.0/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as RevolutOrder;
}

export async function getOrder(orderId: string): Promise<RevolutOrder> {
  return await revolutFetch(`/1.0/orders/${encodeURIComponent(orderId)}`, {
    method: 'GET',
  }) as RevolutOrder;
}
