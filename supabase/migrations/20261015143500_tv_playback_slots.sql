ALTER TABLE public.tv_videos
  ADD COLUMN fallback_url text CHECK (fallback_url IS NULL OR fallback_url ~ '^https://'),
  ADD COLUMN max_duration_seconds integer CHECK (max_duration_seconds BETWEEN 1 AND 3600),
  ADD COLUMN source_url text CHECK (source_url IS NULL OR source_url ~ '^https://'),
  ADD COLUMN credit text CHECK (credit IS NULL OR char_length(credit) <= 200);
