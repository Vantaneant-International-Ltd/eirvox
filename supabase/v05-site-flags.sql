-- ============================================================
-- ÉIRVOX · Seed site_settings row for admin-toggleable flags
-- ============================================================
--
-- Two visibility gates live in src/lib/flags.ts and read from
-- public.site_settings (key = 'flags', value = jsonb). This file
-- inserts the default row so the admin Settings page has
-- something to toggle.
--
-- Both gates default to safe values:
--   coming_soon = true    (visitors see ComingSoonHero)
--   maintenance = false   (no maintenance overlay)
--
-- Once admins flip these from /admin/settings, the same row is
-- upserted. RLS: site_settings_admin_all permits the upsert;
-- site_settings_public_read permits anon SELECT so visitors see
-- the current state on every page load.
--
-- Idempotent: safe to re-run, won't overwrite existing flags.
-- ============================================================

INSERT INTO public.site_settings (key, value)
VALUES (
  'flags',
  '{
    "coming_soon": true,
    "maintenance": false,
    "maintenance_message": "We''re making a quick update. We''ll be back shortly.",
    "support_email": "support@eirvox.ie"
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

NOTIFY pgrst, 'reload schema';


-- ============================================================
-- Verify
-- ============================================================
-- SELECT key, value FROM public.site_settings WHERE key = 'flags';
--
-- Expected: one row, jsonb value with the four keys above.
-- ============================================================
