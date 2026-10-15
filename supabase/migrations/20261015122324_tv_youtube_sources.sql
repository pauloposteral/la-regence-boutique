ALTER TABLE public.tv_videos
  ADD COLUMN source_type text NOT NULL DEFAULT 'file',
  ADD COLUMN youtube_id text,
  ADD CONSTRAINT tv_video_source CHECK (source_type IN ('file', 'youtube')),
  ADD CONSTRAINT tv_video_youtube CHECK (
    (source_type = 'file' AND youtube_id IS NULL) OR
    (source_type = 'youtube' AND youtube_id IS NOT NULL AND youtube_id ~ '^[A-Za-z0-9_-]{11}$'
      AND url = 'https://www.youtube.com/watch?v=' || youtube_id AND storage_path IS NULL AND fit = 'contain')
  );
