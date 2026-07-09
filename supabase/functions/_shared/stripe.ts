// ============================================================
// ÉIRVOX — Stripe client for Edge Functions (Deno)
// ============================================================
// Server-only. Uses the official Stripe SDK via npm: specifier.
//
// Env vars (set via `supabase secrets set ...`):
//   STRIPE_SECRET_KEY       sk_live_… (live) or sk_test_… (test)
//   STRIPE_WEBHOOK_SECRET   whsec_…   (the SIGNING secret from the
//                           Stripe Dashboard → Developers → Webhooks
//                           endpoint you point at stripe-webhook)
//
// The publishable key (pk_…) is PUBLIC and belongs in the frontend
// build (VITE_STRIPE_PUBLISHABLE_KEY), never here.
// ============================================================

import Stripe from 'npm:stripe@17.5.0';

const SECRET = Deno.env.get('STRIPE_SECRET_KEY');

export function getStripe(): Stripe {
  if (!SECRET) {
    throw new Error('STRIPE_SECRET_KEY missing. Set via `supabase secrets set STRIPE_SECRET_KEY=…`.');
  }
  // httpClient: Fetch is required on Deno (no Node http).
  return new Stripe(SECRET, {
    apiVersion: '2024-12-18.acacia',
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export function eurosToMinor(euros: number): number {
  return Math.round(euros * 100);
}
