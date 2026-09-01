-- Configurable pre-adzan countdown duration (per-prayer variant support).
-- Single-row pattern on display_settings (id=1).
ALTER TABLE public.display_settings
  ADD COLUMN IF NOT EXISTS countdown_default_minutes integer NOT NULL DEFAULT 5
    CHECK (countdown_default_minutes BETWEEN 1 AND 30),
  ADD COLUMN IF NOT EXISTS countdown_per_prayer jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ponytail: per-prayer values validated at the edge function trust boundary
-- (keys in {imsak,subuh,syuruq,dzuhur,jumat,ashar,maghrib,isya}, ints 1-30).
-- Add a DB CHECK only if ad-hoc writes bypass the function.
