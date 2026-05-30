// ============================================================
// GET /api/health
// Smoke check: confirms the Edge runtime is alive and that env
// vars are wired. Returns 200 with a small JSON body.
// Does not touch Supabase to keep cold-start fast and offline-safe.
// ============================================================

import { ok } from './_lib/supabase-admin';

export const config = { runtime: 'edge' };

export default async function handler(_req: Request): Promise<Response> {
  return ok({
    ok: true,
    service: 'eirvox-api',
    runtime: 'edge',
    env: {
      url: !!process.env.VITE_SUPABASE_URL,
      service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
}
