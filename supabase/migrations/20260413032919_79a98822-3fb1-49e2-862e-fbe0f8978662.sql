
INSERT INTO storage.buckets (id, name, public) VALUES ('meditation-audios', 'meditation-audios', false);

CREATE POLICY "Users can read their own meditation audios"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'meditation-audios' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own meditation audios"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'meditation-audios' AND auth.uid()::text = (storage.foldername(name))[1]);
