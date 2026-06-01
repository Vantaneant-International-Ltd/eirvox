// ============================================================
// ÉIRVOX — Revolut Merchant API client (Edge Function port)
// ============================================================
// Identical logic to the old api/_lib/revolut.ts; only the env
// reads + types adapted for Deno.
//
// Env vars (set via `supabase secrets set ...`):
//   REVOLUT_API_KEY      sk_... (live) or sk_sandbox_... (sandbox)
//   REVOLUT_API_BASE     https://merchant.revolut.com/api (live)
//                        https://sandbox-merchant.revolut.com/api (sandbox)
//   REVOLUT_API_VERSION  date string, e.g. 2024-09-01
// ============================================================

const API_KEY = Deno.env.get('REVOLUT_API_KEY');
const API_BASE = Deno.env.get('REVOLUT_API_BASE') ?? 'https://merchant.revolut.com/api';
const API_VERSION = Deno.env.get('REVOLUT_API_VERSION') ?? '2024-09-01';

function requireKey(): string {
  if (!API_KEY) {
    throw new Error('REVOLUT_API_KEY missing. Set via `supabase secrets set REVOLUT_API_KEY=...`.');
  }
  return API_KEY;
}

export function eurosToMinor(euros: number): number { return Math.round(euros * 100); }
export function minorToEuros(minor: number): number { return minor / 100; }

export interface CreateOrderInput {
  amount: number;
  currency?: string;
  description?: string;
  merchant_order_ext_ref?: string;
  redirect_url?: string;
  metadata?: Record<string, string>;
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
