-- Generated 2026-08-02T10:13:23.994Z
BEGIN;

-- ===== MIGRATION =====
-- [MIGRATION] migration system.20260802094624 (add)
-- Migration 20260802094624: secure-sprint-1-4
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
INSERT INTO "system"."custom_migrations" ("version", "name", "statements", "created_at") VALUES ('20260802094624', 'secure-sprint-1-4', ARRAY['CREATE TABLE IF NOT EXISTS public.admin_users (
  email text PRIMARY KEY CHECK (email = lower(email)),
  created_at timestamptz NOT NULL DEFAULT now()
)', 'INSERT INTO public.admin_users (email)
VALUES (''takmir@alhidayahsiteba.web.id'')
ON CONFLICT (email) DO NOTHING', 'CREATE OR REPLACE FUNCTION public.is_masjid_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE email = lower(COALESCE(auth.jwt() ->> ''email'', ''''))
  );
$$', 'REVOKE ALL ON public.admin_users FROM anon, authenticated', 'GRANT EXECUTE ON FUNCTION public.is_masjid_admin() TO authenticated', 'DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    ''agendas'',
    ''audio_settings'',
    ''donation_settings'',
    ''friday_settings'',
    ''iqamah_settings'',
    ''media_items'',
    ''mosque_profiles'',
    ''prayer_locations'',
    ''prayer_schedules'',
    ''prayer_time_corrections'',
    ''running_texts'',
    ''theme_settings''
  ]
  LOOP
    EXECUTE format(''ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY'', table_name);
    EXECUTE format(''DROP POLICY IF EXISTS masjid_admin_all ON public.%I'', table_name);
    EXECUTE format(
      ''CREATE POLICY masjid_admin_all ON public.%I FOR ALL TO authenticated USING ((SELECT public.is_masjid_admin())) WITH CHECK ((SELECT public.is_masjid_admin()))'',
      table_name
    );
    EXECUTE format(''REVOKE ALL ON public.%I FROM anon'', table_name);
    EXECUTE format(''GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated'', table_name);
  END LOOP;
END
$$', 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY', 'DROP POLICY IF EXISTS storage_objects_owner_select ON storage.objects', 'DROP POLICY IF EXISTS storage_objects_owner_insert ON storage.objects', 'DROP POLICY IF EXISTS storage_objects_owner_update ON storage.objects', 'DROP POLICY IF EXISTS storage_objects_owner_delete ON storage.objects', 'DROP POLICY IF EXISTS masjid_assets_public_read ON storage.objects', 'DROP POLICY IF EXISTS masjid_assets_admin_insert ON storage.objects', 'DROP POLICY IF EXISTS masjid_assets_admin_update ON storage.objects', 'DROP POLICY IF EXISTS masjid_assets_admin_delete ON storage.objects', 'CREATE POLICY masjid_assets_public_read ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket = ''masjid-assets'')', 'CREATE POLICY masjid_assets_admin_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket = ''masjid-assets'' AND (SELECT public.is_masjid_admin()))', 'CREATE POLICY masjid_assets_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket = ''masjid-assets'' AND (SELECT public.is_masjid_admin()))
  WITH CHECK (bucket = ''masjid-assets'' AND (SELECT public.is_masjid_admin()))', 'CREATE POLICY masjid_assets_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket = ''masjid-assets'' AND (SELECT public.is_masjid_admin()))', 'GRANT USAGE ON SCHEMA storage TO anon, authenticated', 'GRANT SELECT ON storage.objects TO anon', 'GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated'], '2026-08-02T09:47:38.229063+00:00')
  ON CONFLICT ("version") DO UPDATE SET "name" = EXCLUDED."name", "statements" = EXCLUDED."statements", "created_at" = EXCLUDED."created_at";

-- [MIGRATION] migration system.20260802095239 (add)
-- Migration 20260802095239: persist-display-config
CREATE TABLE IF NOT EXISTS public.display_settings (
  id bigint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  hijri_correction_days integer NOT NULL DEFAULT 0 CHECK (hijri_correction_days BETWEEN -5 AND 5),
  adzan_duration_seconds integer NOT NULL DEFAULT 180 CHECK (adzan_duration_seconds BETWEEN 1 AND 900),
  adzan_display_message text NOT NULL DEFAULT 'Mari Menunaikan Shalat Berjamaah di Masjid',
  syuruq_enabled boolean NOT NULL DEFAULT true,
  syuruq_duration_minutes integer NOT NULL DEFAULT 15 CHECK (syuruq_duration_minutes BETWEEN 1 AND 60),
  syuruq_display_message text NOT NULL DEFAULT 'Waktu terlarang shalat saat matahari terbit hingga masuk waktu Dhuha',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.display_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
CREATE TRIGGER display_settings_updated_at
  BEFORE UPDATE ON public.display_settings
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
ALTER TABLE public.display_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY masjid_admin_all ON public.display_settings
  FOR ALL TO authenticated
  USING ((SELECT public.is_masjid_admin()))
  WITH CHECK ((SELECT public.is_masjid_admin()));
REVOKE ALL ON public.display_settings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.display_settings TO authenticated;
INSERT INTO "system"."custom_migrations" ("version", "name", "statements", "created_at") VALUES ('20260802095239', 'persist-display-config', ARRAY['CREATE TABLE IF NOT EXISTS public.display_settings (
  id bigint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  hijri_correction_days integer NOT NULL DEFAULT 0 CHECK (hijri_correction_days BETWEEN -5 AND 5),
  adzan_duration_seconds integer NOT NULL DEFAULT 180 CHECK (adzan_duration_seconds BETWEEN 1 AND 900),
  adzan_display_message text NOT NULL DEFAULT ''Mari Menunaikan Shalat Berjamaah di Masjid'',
  syuruq_enabled boolean NOT NULL DEFAULT true,
  syuruq_duration_minutes integer NOT NULL DEFAULT 15 CHECK (syuruq_duration_minutes BETWEEN 1 AND 60),
  syuruq_display_message text NOT NULL DEFAULT ''Waktu terlarang shalat saat matahari terbit hingga masuk waktu Dhuha'',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
)', 'INSERT INTO public.display_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING', 'CREATE TRIGGER display_settings_updated_at
  BEFORE UPDATE ON public.display_settings
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at()', 'ALTER TABLE public.display_settings ENABLE ROW LEVEL SECURITY', 'CREATE POLICY masjid_admin_all ON public.display_settings
  FOR ALL TO authenticated
  USING ((SELECT public.is_masjid_admin()))
  WITH CHECK ((SELECT public.is_masjid_admin()))', 'REVOKE ALL ON public.display_settings FROM anon', 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.display_settings TO authenticated'], '2026-08-02T09:53:01.926688+00:00')
  ON CONFLICT ("version") DO UPDATE SET "name" = EXCLUDED."name", "statements" = EXCLUDED."statements", "created_at" = EXCLUDED."created_at";

-- [MIGRATION] migration system.20260802100443 (add)
-- Migration 20260802100443: enforce-sprint-1-4-integrity
ALTER TABLE public.audio_settings
  ADD CONSTRAINT audio_settings_type_key UNIQUE (type),
  ADD CONSTRAINT audio_settings_volume_check CHECK (volume BETWEEN 0 AND 100),
  ADD CONSTRAINT audio_settings_play_before_minutes_check CHECK (play_before_minutes IS NULL OR play_before_minutes >= 0),
  ADD CONSTRAINT audio_settings_play_after_minutes_check CHECK (play_after_minutes IS NULL OR play_after_minutes >= 0);
ALTER TABLE public.iqamah_settings
  ADD CONSTRAINT iqamah_settings_duration_minutes_check CHECK (duration_minutes BETWEEN 1 AND 60);
ALTER TABLE public.prayer_time_corrections
  ADD CONSTRAINT prayer_time_corrections_minutes_check CHECK (correction_minutes BETWEEN -60 AND 60);
ALTER TABLE public.friday_settings
  ADD CONSTRAINT friday_settings_khutbah_duration_check CHECK (khutbah_duration_minutes BETWEEN 1 AND 180);
CREATE UNIQUE INDEX mosque_profiles_singleton ON public.mosque_profiles ((true));
CREATE UNIQUE INDEX friday_settings_singleton ON public.friday_settings ((true));
CREATE UNIQUE INDEX prayer_locations_one_active ON public.prayer_locations ((is_active)) WHERE is_active;
CREATE TRIGGER mosque_profiles_updated_at
  BEFORE UPDATE ON public.mosque_profiles
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER prayer_locations_updated_at
  BEFORE UPDATE ON public.prayer_locations
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER prayer_schedules_updated_at
  BEFORE UPDATE ON public.prayer_schedules
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER prayer_time_corrections_updated_at
  BEFORE UPDATE ON public.prayer_time_corrections
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER iqamah_settings_updated_at
  BEFORE UPDATE ON public.iqamah_settings
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER audio_settings_updated_at
  BEFORE UPDATE ON public.audio_settings
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER friday_settings_updated_at
  BEFORE UPDATE ON public.friday_settings
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
INSERT INTO "system"."custom_migrations" ("version", "name", "statements", "created_at") VALUES ('20260802100443', 'enforce-sprint-1-4-integrity', ARRAY['ALTER TABLE public.audio_settings
  ADD CONSTRAINT audio_settings_type_key UNIQUE (type),
  ADD CONSTRAINT audio_settings_volume_check CHECK (volume BETWEEN 0 AND 100),
  ADD CONSTRAINT audio_settings_play_before_minutes_check CHECK (play_before_minutes IS NULL OR play_before_minutes >= 0),
  ADD CONSTRAINT audio_settings_play_after_minutes_check CHECK (play_after_minutes IS NULL OR play_after_minutes >= 0)', 'ALTER TABLE public.iqamah_settings
  ADD CONSTRAINT iqamah_settings_duration_minutes_check CHECK (duration_minutes BETWEEN 1 AND 60)', 'ALTER TABLE public.prayer_time_corrections
  ADD CONSTRAINT prayer_time_corrections_minutes_check CHECK (correction_minutes BETWEEN -60 AND 60)', 'ALTER TABLE public.friday_settings
  ADD CONSTRAINT friday_settings_khutbah_duration_check CHECK (khutbah_duration_minutes BETWEEN 1 AND 180)', 'CREATE UNIQUE INDEX mosque_profiles_singleton ON public.mosque_profiles ((true))', 'CREATE UNIQUE INDEX friday_settings_singleton ON public.friday_settings ((true))', 'CREATE UNIQUE INDEX prayer_locations_one_active ON public.prayer_locations ((is_active)) WHERE is_active', 'CREATE TRIGGER mosque_profiles_updated_at
  BEFORE UPDATE ON public.mosque_profiles
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at()', 'CREATE TRIGGER prayer_locations_updated_at
  BEFORE UPDATE ON public.prayer_locations
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at()', 'CREATE TRIGGER prayer_schedules_updated_at
  BEFORE UPDATE ON public.prayer_schedules
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at()', 'CREATE TRIGGER prayer_time_corrections_updated_at
  BEFORE UPDATE ON public.prayer_time_corrections
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at()', 'CREATE TRIGGER iqamah_settings_updated_at
  BEFORE UPDATE ON public.iqamah_settings
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at()', 'CREATE TRIGGER audio_settings_updated_at
  BEFORE UPDATE ON public.audio_settings
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at()', 'CREATE TRIGGER friday_settings_updated_at
  BEFORE UPDATE ON public.friday_settings
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at()'], '2026-08-02T10:05:22.70844+00:00')
  ON CONFLICT ("version") DO UPDATE SET "name" = EXCLUDED."name", "statements" = EXCLUDED."statements", "created_at" = EXCLUDED."created_at";

-- ===== DDL =====
-- [DDL] table public.admin_users (add)
CREATE TABLE IF NOT EXISTS public.admin_users (email text NOT NULL, created_at timestamp with time zone NOT NULL DEFAULT now(), CHECK (email = lower(email)), PRIMARY KEY (email));

-- [DDL] table public.display_settings (add)
CREATE TABLE IF NOT EXISTS public.display_settings (id bigint NOT NULL DEFAULT 1, hijri_correction_days integer NOT NULL DEFAULT 0, adzan_duration_seconds integer NOT NULL DEFAULT 180, adzan_display_message text NOT NULL DEFAULT 'Mari Menunaikan Shalat Berjamaah di Masjid'::text, syuruq_enabled boolean NOT NULL DEFAULT true, syuruq_duration_minutes integer NOT NULL DEFAULT 15, syuruq_display_message text NOT NULL DEFAULT 'Waktu terlarang shalat saat matahari terbit hingga masuk waktu Dhuha'::text, created_at timestamp with time zone NOT NULL DEFAULT now(), updated_at timestamp with time zone NOT NULL DEFAULT now(), CHECK (id = 1), CHECK (hijri_correction_days >= '-5'::integer AND hijri_correction_days <= 5), CHECK (adzan_duration_seconds >= 1 AND adzan_duration_seconds <= 900), CHECK (syuruq_duration_minutes >= 1 AND syuruq_duration_minutes <= 60), PRIMARY KEY (id));

-- [DDL] policy public.agendas.masjid_admin_all (add)
DROP POLICY IF EXISTS "masjid_admin_all" ON "public"."agendas";
CREATE POLICY "masjid_admin_all" ON "public"."agendas"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING (( SELECT is_masjid_admin() AS is_masjid_admin))
  WITH CHECK (( SELECT is_masjid_admin() AS is_masjid_admin));

-- [DDL] policy public.media_items.masjid_admin_all (add)
DROP POLICY IF EXISTS "masjid_admin_all" ON "public"."media_items";
CREATE POLICY "masjid_admin_all" ON "public"."media_items"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING (( SELECT is_masjid_admin() AS is_masjid_admin))
  WITH CHECK (( SELECT is_masjid_admin() AS is_masjid_admin));

-- [DDL] policy public.running_texts.masjid_admin_all (add)
DROP POLICY IF EXISTS "masjid_admin_all" ON "public"."running_texts";
CREATE POLICY "masjid_admin_all" ON "public"."running_texts"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING (( SELECT is_masjid_admin() AS is_masjid_admin))
  WITH CHECK (( SELECT is_masjid_admin() AS is_masjid_admin));

-- [DDL] policy public.audio_settings.masjid_admin_all (add)
DROP POLICY IF EXISTS "masjid_admin_all" ON "public"."audio_settings";
CREATE POLICY "masjid_admin_all" ON "public"."audio_settings"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING (( SELECT is_masjid_admin() AS is_masjid_admin))
  WITH CHECK (( SELECT is_masjid_admin() AS is_masjid_admin));

-- [DDL] policy public.theme_settings.masjid_admin_all (add)
DROP POLICY IF EXISTS "masjid_admin_all" ON "public"."theme_settings";
CREATE POLICY "masjid_admin_all" ON "public"."theme_settings"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING (( SELECT is_masjid_admin() AS is_masjid_admin))
  WITH CHECK (( SELECT is_masjid_admin() AS is_masjid_admin));

-- [DDL] policy public.friday_settings.masjid_admin_all (add)
DROP POLICY IF EXISTS "masjid_admin_all" ON "public"."friday_settings";
CREATE POLICY "masjid_admin_all" ON "public"."friday_settings"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING (( SELECT is_masjid_admin() AS is_masjid_admin))
  WITH CHECK (( SELECT is_masjid_admin() AS is_masjid_admin));

-- [DDL] policy public.iqamah_settings.masjid_admin_all (add)
DROP POLICY IF EXISTS "masjid_admin_all" ON "public"."iqamah_settings";
CREATE POLICY "masjid_admin_all" ON "public"."iqamah_settings"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING (( SELECT is_masjid_admin() AS is_masjid_admin))
  WITH CHECK (( SELECT is_masjid_admin() AS is_masjid_admin));

-- [DDL] policy public.mosque_profiles.masjid_admin_all (add)
DROP POLICY IF EXISTS "masjid_admin_all" ON "public"."mosque_profiles";
CREATE POLICY "masjid_admin_all" ON "public"."mosque_profiles"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING (( SELECT is_masjid_admin() AS is_masjid_admin))
  WITH CHECK (( SELECT is_masjid_admin() AS is_masjid_admin));

-- [DDL] policy public.display_settings.masjid_admin_all (add)
DROP POLICY IF EXISTS "masjid_admin_all" ON "public"."display_settings";
CREATE POLICY "masjid_admin_all" ON "public"."display_settings"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING (( SELECT is_masjid_admin() AS is_masjid_admin))
  WITH CHECK (( SELECT is_masjid_admin() AS is_masjid_admin));

-- [DDL] policy public.prayer_locations.masjid_admin_all (add)
DROP POLICY IF EXISTS "masjid_admin_all" ON "public"."prayer_locations";
CREATE POLICY "masjid_admin_all" ON "public"."prayer_locations"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING (( SELECT is_masjid_admin() AS is_masjid_admin))
  WITH CHECK (( SELECT is_masjid_admin() AS is_masjid_admin));

-- [DDL] policy public.prayer_schedules.masjid_admin_all (add)
DROP POLICY IF EXISTS "masjid_admin_all" ON "public"."prayer_schedules";
CREATE POLICY "masjid_admin_all" ON "public"."prayer_schedules"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING (( SELECT is_masjid_admin() AS is_masjid_admin))
  WITH CHECK (( SELECT is_masjid_admin() AS is_masjid_admin));

-- [DDL] policy public.donation_settings.masjid_admin_all (add)
DROP POLICY IF EXISTS "masjid_admin_all" ON "public"."donation_settings";
CREATE POLICY "masjid_admin_all" ON "public"."donation_settings"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING (( SELECT is_masjid_admin() AS is_masjid_admin))
  WITH CHECK (( SELECT is_masjid_admin() AS is_masjid_admin));

-- [DDL] policy public.prayer_time_corrections.masjid_admin_all (add)
DROP POLICY IF EXISTS "masjid_admin_all" ON "public"."prayer_time_corrections";
CREATE POLICY "masjid_admin_all" ON "public"."prayer_time_corrections"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING (( SELECT is_masjid_admin() AS is_masjid_admin))
  WITH CHECK (( SELECT is_masjid_admin() AS is_masjid_admin));

-- [DDL] function public.is_masjid_admin() (add)
CREATE OR REPLACE FUNCTION public.is_masjid_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE email = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );
$function$;

COMMIT;