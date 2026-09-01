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
