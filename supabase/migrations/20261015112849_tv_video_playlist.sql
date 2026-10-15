-- TV programming is publicly readable; all changes require the existing admin role.
CREATE TABLE public.tv_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  url text NOT NULL CHECK (url ~ '^https://' OR url ~ '^/__l5e/assets-v1/'),
  storage_path text,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN 0 AND 999999),
  active boolean NOT NULL DEFAULT true,
  archived_at timestamptz,
  fit text NOT NULL DEFAULT 'contain' CHECK (fit IN ('contain', 'cover')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tv_videos ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.tv_videos TO anon, authenticated;
GRANT INSERT, UPDATE ON public.tv_videos TO authenticated;
CREATE POLICY "TV public programming" ON public.tv_videos FOR SELECT TO anon, authenticated
  USING (active AND archived_at IS NULL);
CREATE POLICY "TV admins read all" ON public.tv_videos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "TV admins insert" ON public.tv_videos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "TV admins update" ON public.tv_videos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX tv_videos_programming_order ON public.tv_videos (sort_order, id) WHERE active AND archived_at IS NULL;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('tv-videos', 'tv-videos', true, 52428800, ARRAY['video/mp4','video/webm']);
CREATE POLICY "TV admins manage storage" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'tv-videos' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'tv-videos' AND public.has_role(auth.uid(), 'admin'));

-- Reuse the project's actual cinematic brand video. No placeholders or third-party footage.
INSERT INTO public.tv_videos (id, title, url, sort_order, fit)
VALUES ('60a7d76e-6c59-4d34-948f-a2f9fe8203e0', 'La Régence — Cada xícara, uma experiência',
  '/__l5e/assets-v1/656fe082-70c0-4e39-9ba3-b99f4a1fb7c4/hero-cinematic.mp4', 0, 'contain');
