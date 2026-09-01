CREATE TABLE IF NOT EXISTS public.admin_users (
  email text PRIMARY KEY CHECK (email = lower(email)),
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.admin_users (email)
VALUES ('takmir@alhidayahsiteba.web.id')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_masjid_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE email = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );
$$;

REVOKE ALL ON public.admin_users FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_masjid_admin() TO authenticated;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'agendas',
    'audio_settings',
    'donation_settings',
    'friday_settings',
    'iqamah_settings',
    'media_items',
    'mosque_profiles',
    'prayer_locations',
    'prayer_schedules',
    'prayer_time_corrections',
    'running_texts',
    'theme_settings'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS masjid_admin_all ON public.%I', table_name);
    EXECUTE format(
      'CREATE POLICY masjid_admin_all ON public.%I FOR ALL TO authenticated USING ((SELECT public.is_masjid_admin())) WITH CHECK ((SELECT public.is_masjid_admin()))',
      table_name
    );
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
  END LOOP;
END
$$;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS storage_objects_owner_select ON storage.objects;
DROP POLICY IF EXISTS storage_objects_owner_insert ON storage.objects;
DROP POLICY IF EXISTS storage_objects_owner_update ON storage.objects;
DROP POLICY IF EXISTS storage_objects_owner_delete ON storage.objects;
DROP POLICY IF EXISTS masjid_assets_public_read ON storage.objects;
DROP POLICY IF EXISTS masjid_assets_admin_insert ON storage.objects;
DROP POLICY IF EXISTS masjid_assets_admin_update ON storage.objects;
DROP POLICY IF EXISTS masjid_assets_admin_delete ON storage.objects;

CREATE POLICY masjid_assets_public_read ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket = 'masjid-assets');

CREATE POLICY masjid_assets_admin_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket = 'masjid-assets' AND (SELECT public.is_masjid_admin()));

CREATE POLICY masjid_assets_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket = 'masjid-assets' AND (SELECT public.is_masjid_admin()))
  WITH CHECK (bucket = 'masjid-assets' AND (SELECT public.is_masjid_admin()));

CREATE POLICY masjid_assets_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket = 'masjid-assets' AND (SELECT public.is_masjid_admin()));

GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
