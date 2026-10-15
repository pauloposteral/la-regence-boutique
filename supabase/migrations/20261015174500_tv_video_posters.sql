-- Thumbnail metadata follows the existing programming RLS and lifecycle.
ALTER TABLE public.tv_videos ADD COLUMN poster_url text;
ALTER TABLE public.tv_videos ADD CONSTRAINT tv_videos_poster_url_check CHECK (
  poster_url IS NULL OR (char_length(poster_url) <= 2048 AND (
    poster_url ~ '^https://' OR poster_url ~ '^/tv-thumbnails/[A-Za-z0-9_-]+[.]jpg$'
  ))
);
-- The existing admin-only Storage policy also owns the generated JPEG covers.
UPDATE storage.buckets
SET allowed_mime_types = array_append(allowed_mime_types, 'image/jpeg')
WHERE id = 'tv-videos' AND allowed_mime_types IS NOT NULL
  AND NOT ('image/jpeg' = ANY(allowed_mime_types));
