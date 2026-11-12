ALTER TABLE public.tv_videos
  ADD COLUMN IF NOT EXISTS transition_profile text,
  ADD COLUMN IF NOT EXISTS transition_ms integer,
  ADD COLUMN IF NOT EXISTS palette text,
  ADD COLUMN IF NOT EXISTS protect_qr boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS protect_text boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS protect_zoom boolean NOT NULL DEFAULT false;
ALTER TABLE public.tv_videos
  ADD CONSTRAINT tv_videos_transition_profile_check CHECK (transition_profile IS NULL OR transition_profile IN ('clean','light','depth')),
  ADD CONSTRAINT tv_videos_transition_ms_check CHECK (transition_ms IS NULL OR transition_ms BETWEEN 600 AND 1100),
  ADD CONSTRAINT tv_videos_palette_check CHECK (palette IS NULL OR palette IN ('amber','ruby','pistachio','cocoa','neutral'));
COMMENT ON COLUMN public.tv_videos.transition_profile IS 'Presentation: clean|light|depth; NULL = safe default (clean).';
COMMENT ON COLUMN public.tv_videos.transition_ms IS 'Presentation: requested transition duration, clamped per profile by the player.';