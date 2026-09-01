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
