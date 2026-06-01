# ÉIRVOX — Supabase Edge Functions

> Operator guide. Read this before editing anything under `supabase/functions/`.

These functions replace the `/api/*` routes that used to run on Vercel.
They live in Supabase so we have one vendor (DB + auth + storage + serverless
all in the same dashboard, same logs, same secrets). The frontend is on
GitHub Pages; this directory is the entire backend surface.

---

## Map of what lives here

```
supabase/functions/
├── _shared/                 ← imported by every function. NOT itself a function.
│   ├── cors.ts              ← shared CORS headers + preflight responder
│   ├── supabase-admin.ts    ← service-role client (bypasses RLS — handle with care)
│   ├── revolut.ts           ← Revolut Merchant API wrapper (REST, fetch-based)
│   ├── email.ts             ← Resend REST wrapper
│   ├── ratelimit.ts         ← Upstash Redis rate-limit
│   └── turnstile.ts         ← Cloudflare Turnstile verifier
│
├── waitlist/                ← POST  email capture from the coming-soon hero
├── enquiries/               ← POST  buyer enquiry form
├── report/                  ← POST  "report this listing" from any listing detail
├── seller-applications/     ← POST  Cohort apply form
├── payments-create-order/   ← POST  starts a Revolut hosted checkout
├── payments-order-status/   ← GET   polls order state after redirect
└── payments-send-receipt/   ← POST  fires the receipt email after success
```

Function names use `-` (hyphens). Folder name == function name == URL slug.
That convention is mandatory — Supabase routes `/functions/v1/<folder-name>`
literally with no rewrite layer.

The browser calls these at:

```
https://arokrumaxjiidsqfpiii.supabase.co/functions/v1/<name>
```

Constant lives in `src/lib/supabase.ts` as `SUPABASE_FUNCTIONS_URL`.
Never hardcode the URL in component code.

---

## Runtime — Deno, not Node

These run on Supabase's Deno-based Edge Runtime. Things that are different
from the old Vercel/Node setup:

| What | Node (old) | Deno (now) |
|---|---|---|
| Import an npm package | `import x from 'foo'` | `import x from 'npm:foo@1.2.3'` |
| Read env var | `process.env.FOO` | `Deno.env.get('FOO')` |
| Request type | `VercelRequest` | standard `Request` |
| Response type | `res.status(200).json(...)` | `new Response(JSON.stringify(...), { status: 200, headers })` |
| File system | `fs.readFile` | `Deno.readFile` (rarely needed) |

**Always pin npm versions in the import URL.** `import { Resend } from 'npm:resend'`
will pull whatever is latest and silently break the function on the next cold
start. Write `'npm:resend@4.0.1'` and bump deliberately.

---

## Deploying a change

### Manual (one function)

```bash
supabase functions deploy waitlist --project-ref arokrumaxjiidsqfpiii
```

Live in ~10 seconds, no propagation delay, no cache invalidation needed.

### Manual (all functions)

```bash
supabase functions deploy --project-ref arokrumaxjiidsqfpiii
```

### Auto on push to main

The workflow at `.github/workflows/deploy-functions.yml` deploys any function
whose folder was touched since the last successful run. Set `SUPABASE_ACCESS_TOKEN`
as a repo secret (get one at https://supabase.com/dashboard/account/tokens).

If a function fails to deploy, **the existing live version stays running** —
you can't accidentally take a function offline by shipping a syntax error.

---

## Secrets

Set via the Supabase CLI or MCP, **never** committed to the repo:

```bash
# One-time setup. Re-run when rotating.
supabase secrets set REVOLUT_API_KEY=sk_xxx --project-ref arokrumaxjiidsqfpiii
supabase secrets set REVOLUT_WEBHOOK_SECRET=whsec_xxx --project-ref arokrumaxjiidsqfpiii
supabase secrets set RESEND_API_KEY=re_xxx --project-ref arokrumaxjiidsqfpiii
supabase secrets set UPSTASH_REDIS_REST_URL=https://xxx --project-ref arokrumaxjiidsqfpiii
supabase secrets set UPSTASH_REDIS_REST_TOKEN=xxx --project-ref arokrumaxjiidsqfpiii
supabase secrets set TURNSTILE_SECRET_KEY=0x... --project-ref arokrumaxjiidsqfpiii
```

Two secrets are auto-injected — you do NOT set these:

- `SUPABASE_URL` — the project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service-role JWT

`SUPABASE_ANON_KEY` is also injected (for completeness; functions usually use
the service role).

List currently-set secrets:

```bash
supabase secrets list --project-ref arokrumaxjiidsqfpiii
```

The names of set secrets are visible; the values are not.

---

## Logs

Per-function logs at:

```
https://supabase.com/dashboard/project/arokrumaxjiidsqfpiii/functions/<name>/logs
```

Or tail from CLI:

```bash
supabase functions logs <name> --project-ref arokrumaxjiidsqfpiii --tail
```

What gets logged:

- Every invocation gets a row with status code + duration.
- Anything written to `console.log` / `console.error` is captured.
- Stack traces from uncaught errors are captured (less polished than Vercel's
  trace links — you'll often want to add your own structured logs with
  `console.log(JSON.stringify({ msg, ctx }))` to make grepping easier).

Logs retention: 7 days on free plan, longer on paid. Don't rely on logs as
durable audit storage — write to `public.audit_log` for anything we need to
keep.

---

## Local development

To run a function locally against the live DB:

```bash
supabase functions serve --env-file .env.local
# In another shell:
curl -X POST http://localhost:54321/functions/v1/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

`.env.local` should mirror the secrets you set in production. **Never commit
.env.local.**

Hot reload is on by default — save the file, next request runs the new code.

---

## CORS

`_shared/cors.ts` exposes:

- `corsHeaders` — set of headers to append to every response.
- `handleCors(req)` — returns a `Response` for `OPTIONS` preflight, or `null`
  if the request isn't a preflight (call it as the first thing in every
  function and short-circuit when it returns non-null).

Allowed origins are hard-coded in that file. To add a new origin (e.g.
preview deploy domain), edit the `ALLOWED_ORIGINS` array.

Common gotcha: if you add a custom request header on the client (e.g.
`X-EIRVOX-Source: web`), you must add it to `Access-Control-Allow-Headers`
in `_shared/cors.ts` or the browser will reject the response with a CORS
error that looks like a server error in the network tab.

---

## Adding a new function

1. `mkdir supabase/functions/<name>` (hyphenated, lowercase).
2. Create `supabase/functions/<name>/index.ts`. Skeleton:

   ```ts
   import { handleCors, corsHeaders } from '../_shared/cors.ts';

   Deno.serve(async (req) => {
     const preflight = handleCors(req);
     if (preflight) return preflight;

     // your logic here...

     return new Response(JSON.stringify({ ok: true }), {
       status: 200,
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
   });
   ```

3. Add any new secrets via `supabase secrets set ...`.
4. Deploy: `supabase functions deploy <name> --project-ref arokrumaxjiidsqfpiii`.
5. Update the client to call the function (use `SUPABASE_FUNCTIONS_URL` from
   `src/lib/supabase.ts`).
6. Add a row to the table at the top of this file.

---

## External webhook URLs that depend on these functions

When you rotate the project URL or rename a function, **these external systems
will silently break**:

| Source | URL it sends to | What happens if broken |
|---|---|---|
| Revolut Merchant Webhook | `/functions/v1/revolut-webhook` (not yet ported) | Payment confirmations don't reach us; orders sit in `pending` forever. |

Keep this table updated as new webhooks are added.

---

## Rolling back

Supabase doesn't have one-click rollback like Vercel. To revert:

```bash
git checkout <prev-commit> -- supabase/functions/<name>/
supabase functions deploy <name> --project-ref arokrumaxjiidsqfpiii
```

For safety, run the deploy from a tag if you're rolling back a known-good
release.

---

## Cost & limits to watch

Free plan limits (as of writing):

- **500,000 invocations / month** across all functions, combined.
- **2,000,000 function execution seconds / month.**
- **150 MB max response body** per request.
- **150-second timeout** per request (hard limit; you can't lift this).
- **2 MB max source code size** per function bundle.

Most ÉIRVOX endpoints finish in <500ms and use a few KB of memory. Realistic
ceiling before we'd see usage charges: well past 100k DAU.

Watch dashboard → "Edge Functions" panel for current month's usage. If
usage approaches limits, the first thing to check is whether a buggy
client-side `setInterval` is hammering an endpoint (it's happened).

---

## When something breaks in production

1. **Open dashboard logs** for the failing function. Filter by `status >= 400`.
2. **Check secrets**: `supabase secrets list --project-ref arokrumaxjiidsqfpiii`.
   The most common production breakage is "I rotated a key but forgot to set
   it on the functions side."
3. **Local repro**: `supabase functions serve --env-file .env.local` and curl it.
4. **Roll back** (above) if the issue traces to the last deploy.
5. **External**: if it's a Revolut/Resend/Upstash outage, check their
   status pages before assuming it's us:
   - https://status.revolut.com
   - https://status.resend.com
   - https://status.upstash.com

---

## Don't do

- **Don't import from `npm:` without a pinned version.** Silent breakage on
  the next cold start when a transitive dep ships a major.
- **Don't read `process.env`.** Use `Deno.env.get('FOO')`. `process` is
  undefined in Deno; this throws at module-load time, before your handler
  runs, and the function silently 500s with a generic error.
- **Don't bypass `_shared/`** by inlining a Supabase client or Revolut call
  in a function. The shared helpers are the boundary; bug fixes propagate.
- **Don't return raw error.message to the browser** without sanitising.
  Stack traces and SQL fragments leak schema details.
- **Don't keep `SUPABASE_SERVICE_ROLE_KEY` in client code.** It bypasses RLS.
  If you ever see it in a `VITE_*` env var or a Svelte file, you've already
  shipped a security incident — rotate immediately.
