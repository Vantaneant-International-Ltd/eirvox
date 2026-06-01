// ============================================================
// ÉIRVOX — Shared CORS for every Edge Function
// ============================================================
//
// Functions live on supabase.co; the frontend is on eirvox.ie /
// the vercel preview / localhost. Browsers therefore make
// cross-origin requests and need explicit CORS headers.
//
// Allowlist sticks to:
//   - https://eirvox.ie        prod custom domain (GH Pages)
//   - https://eirvox.vercel.app  current Vercel mirror (kill once GH Pages is sole host)
//   - http://localhost:3000    vite dev
//   - http://localhost:5173    vite default port (fallback)
//
// To add a new origin (preview deploy), append it to ALLOWED_ORIGINS.
// Wildcard (*) is INTENTIONALLY NOT supported: any function that
// uses `Authorization` headers or cookies needs an explicit origin.
// ============================================================

const ALLOWED_ORIGINS = new Set([
  'https://eirvox.ie',
  'https://www.eirvox.ie',
  'https://eirvox.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
]);

function originFor(req: Request): string {
  const o = req.headers.get('origin') ?? '';
  return ALLOWED_ORIGINS.has(o) ? o : 'https://eirvox.ie';
}

/** Headers every successful + error response must include. */
export function corsHeaders(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': originFor(req),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

/** Call as the first line of every handler. Returns the preflight
 *  Response when the request is an OPTIONS; null otherwise.
 *
 *  Usage:
 *    const pre = handleCors(req);
 *    if (pre) return pre;
 */
export function handleCors(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null;
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
