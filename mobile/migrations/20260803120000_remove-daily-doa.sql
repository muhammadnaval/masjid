-- Remove the dedicated Daily Doa feature and its rows from the shared media table.
DELETE FROM public.media_items WHERE type IN ('daily_doa', 'doa');

ALTER TABLE public.media_items
  DROP CONSTRAINT IF EXISTS media_items_type_check,
  ADD CONSTRAINT media_items_type_check CHECK (type IN (
    'welcome', 'announcement', 'hadith', 'text',
    'kasTable', 'kastable', 'infoTable', 'infotable', 'donation',
    'image', 'video', 'youtube', 'livestream'
  ));
