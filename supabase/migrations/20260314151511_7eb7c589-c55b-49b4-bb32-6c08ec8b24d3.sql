INSERT INTO storage.buckets (id, name, public) VALUES ('public-assets', 'public-assets', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for public-assets" ON storage.objects FOR SELECT TO public USING (bucket_id = 'public-assets');

CREATE POLICY "Authenticated users can upload to public-assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'public-assets');
