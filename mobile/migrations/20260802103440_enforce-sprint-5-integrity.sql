UPDATE public.running_texts
SET speed = 50
WHERE speed IS NULL OR speed < 10 OR speed > 200;

UPDATE public.media_items
SET duration_seconds = 8
WHERE duration_seconds IS NULL OR duration_seconds < 3 OR duration_seconds > 300;

UPDATE public.media_items
SET type = 'announcement'
WHERE type IS NULL OR type NOT IN (
  'welcome', 'announcement', 'hadith', 'daily_doa', 'doa',
  'kasTable', 'kastable', 'infoTable', 'infotable', 'donation',
  'image', 'video', 'youtube'
);

ALTER TABLE public.running_texts
  DROP CONSTRAINT IF EXISTS running_texts_speed_check,
  ADD CONSTRAINT running_texts_speed_check CHECK (speed BETWEEN 10 AND 200);

ALTER TABLE public.media_items
  DROP CONSTRAINT IF EXISTS media_items_duration_seconds_check,
  ADD CONSTRAINT media_items_duration_seconds_check CHECK (duration_seconds BETWEEN 3 AND 300),
  DROP CONSTRAINT IF EXISTS media_items_type_check,
  ADD CONSTRAINT media_items_type_check CHECK (type IN (
    'welcome', 'announcement', 'hadith', 'daily_doa', 'doa',
    'kasTable', 'kastable', 'infoTable', 'infotable', 'donation',
    'image', 'video', 'youtube'
  ));
