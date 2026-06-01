// ============================================================
// ÉIRVOX — Rate limiting for Edge Functions
// ============================================================
// Same Upstash Redis approach as before. Fail-mode rules:
//
//   - production AND creds missing -> fail-CLOSED (503)
//     A misconfigured prod deploy must not silently accept unbounded
//     anonymous writes.
//
//   - non-production AND creds missing -> fail-OPEN with warning
//
// Production detection: we treat the function as production
// whenever it's deployed to Supabase (SUPABASE_URL contains
// .supabase.co). Local `supabase functions serve` runs against a
// localhost SUPABASE_URL so it's treated as dev.
//
// Env vars:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
//
// Tune per-endpoint windows in `limiters` below.
// ============================================================

import { Ratelimit } from 'npm:@upstash/ratelimit@2.0.5';
import { Redis } from 'npm:@upstash/redis@1.34.3';
import { clientIp } from './supabase-admin.ts';
import { corsHeaders } from './cors.ts';

const supaUrl = Deno.env.get('SUPABASE_URL') ?? '';
const isProduction = supaUrl.includes('.supabase.co');

const url = Deno.env.get('UPSTASH_REDIS_REST_URL');
const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

let warnedMissing = false;
function warnMissingOnce() {
  if (warnedMissing) return;
  warnedMissing = true;
  console.warn(
    '[ratelimit] UPSTASH creds missing. ' +
    (isProduction
      ? 'PRODUCTION: rate-limit calls will return 503.'
      : 'Non-production: rate-limit is a no-op until configured.')
  );
}

const redis = url && token ? new Redis({ url, token }) : null;

const limiters: Record<string, Ratelimit | null> = {
  waitlist:              redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,  '1 m'),  prefix: 'evx:waitlist'    }) : null,
  enquiries:             redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(2,  '30 s'), prefix: 'evx:enquiries'   }) : null,
  'seller-applications': redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(1,  '1 m'),  prefix: 'evx:seller-apps' }) : null,
  reports:               redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(2,  '1 m'),  prefix: 'evx:reports'     }) : null,
};

export type LimiterKey = keyof typeof limiters;

export interface RateLimitOutcome {
  allowed: boolean;
  failClosed?: boolean;
  retryAfterMs?: number;
}

export async function rateLimit(req: Request, key: LimiterKey): Promise<RateLimitOutcome> {
  const limiter = limiters[key];
  if (!limiter) {
    warnMissingOnce();
    return isProduction
      ? { allowed: false, failClosed: true }
      : { allowed: true };
  }
  const ip = clientIp(req) ?? 'unknown';
  const result = await limiter.limit(ip);
  if (result.success) return { allowed: true };
  const retryAfterMs = Math.max(0, result.reset - Date.now());
  return { allowed: false, retryAfterMs };
}

export function rateLimitResponse(req: Request, outcome: RateLimitOutcome): Response {
  if (outcome.failClosed) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Service temporarily unavailable.' }),
      {
        status: 503,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          ...corsHeaders(req),
        },
      },
    );
  }
  const retryAfterSec = Math.ceil((outcome.retryAfterMs ?? 1000) / 1000);
  return new Response(
    JSON.stringify({ ok: false, error: 'Too many requests. Try again in a moment.' }),
    {
      status: 429,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'retry-after': String(retryAfterSec),
        ...corsHeaders(req),
      },
    },
  );
}
