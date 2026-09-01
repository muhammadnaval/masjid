ALTER TABLE public.media_items
  DROP CONSTRAINT IF EXISTS media_items_type_check,
  ADD CONSTRAINT media_items_type_check CHECK (type IN (
    'welcome', 'announcement', 'hadith', 'text', 'daily_doa', 'doa',
    'kasTable', 'kastable', 'infoTable', 'infotable', 'donation',
    'image', 'video', 'youtube', 'livestream'
  ));
