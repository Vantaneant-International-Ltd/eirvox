// ============================================================
// ÉIRVOX — Rate limiting for /api/* Edge routes
// ============================================================
//
// Backed by Upstash Redis (HTTP-based, Edge-compatible). Fail mode:
//
//   - production AND creds missing -> fail-CLOSED (503)
//     A misconfigured prod deploy must not silently accept unbounded
//     anonymous writes; this would be the rate-limit blocker the
//     audit flagged.
//
//   - non-production AND creds missing -> fail-OPEN with warning
//     Local dev (`vite` or `vercel dev`) without Upstash configured
//     just works; the rate-limit becomes a no-op so submissions can
//     be exercised end-to-end.
//
// Env vars (server-only, no VITE_ prefix):
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
//
// See https://upstash.com/docs/redis/sdks/ratelimit-ts for the
// underlying library.
// ============================================================

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { clientIp } from './supabase-admin';

const isProduction = process.env.VERCEL_ENV === 'production';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

let warnedMissing = false;
function warnMissingOnce() {
  if (warnedMissing) return;
  warnedMissing = true;
  console.warn(
    '[ratelimit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing. ' +
    (isProduction
      ? 'PRODUCTION: rate-limit calls will return 503.'
      : 'Non-production: rate-limit is a no-op until configured.')
  );
}

// One Redis client per cold start.
const redis = url && token ? new Redis({ url, token }) : null;

// Pre-built limiter instances. Sliding window keeps memory tight on
// Upstash and avoids edge-of-bucket bursts. Tune per endpoint.
const limiters: Record<string, Ratelimit | null> = {
  waitlist:            redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,  '1 m'),  prefix: 'evx:waitlist'    }) : null,
  enquiries:           redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(2,  '30 s'), prefix: 'evx:enquiries'   }) : null,
  'seller-applications': redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(1, '1 m'), prefix: 'evx:seller-apps' }) : null,
};

export type LimiterKey = keyof typeof limiters;

export interface RateLimitOutcome {
  allowed: boolean;
  /** 503 response body if `allowed=false` due to misconfiguration. */
  failClosed?: boolean;
  /** ms until the bucket refills (only when `allowed=false` due to limit). */
  retryAfterMs?: number;
}

/** Check a request against the named limiter. Pass the Request so we can
 *  derive the client IP. Caller decides what to do with the outcome. */
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

/** Build the 429 / 503 response for a blocked request. */
export function rateLimitResponse(outcome: RateLimitOutcome): Response {
  if (outcome.failClosed) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Service temporarily unavailable.' }),
      { status: 503, headers: { 'content-type': 'application/json; charset=utf-8' } }
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
      },
    }
  );
}
