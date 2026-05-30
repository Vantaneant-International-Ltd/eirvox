# audit/

Live-database snapshots, committed deliberately as a drift-detection aid.

These files are **not source of truth**. The source of truth for repo-side schema is the `supabase/*.sql` files. The dumps in this directory are auto-generated mirrors of what the live database (project ref `arokrumaxjiidsqfpiii`) actually looks like at a point in time — useful for catching drift between repo and live.

## Files

- `supabase_full_schema.sql` — `pg_dump`-style DDL for the `public`, `auth`, and `storage` schemas. Includes tables, views, functions, triggers, policies, indexes, grants. No data rows.

## How to refresh

```
supabase link --project-ref arokrumaxjiidsqfpiii
supabase db dump --schema public --schema auth --schema storage > audit/supabase_full_schema.sql
```

Commit the regenerated file with a clear message (e.g. `audit: refresh live schema snapshot YYYY-MM-DD`).

## When to refresh

- Before starting a schema-touching task, to confirm the assumed live state.
- After applying a migration to live.
- Whenever the repo and live have drifted and you want a fresh diff target.

## What's safe to share

The dump contains no passwords, no JWT secrets, and no row data. It does reveal the full database structure (table names, column types, RLS policy bodies, function definitions). That structure is also visible to anyone with the anon key by exploring PostgREST, so committing it doesn't increase the attack surface.
