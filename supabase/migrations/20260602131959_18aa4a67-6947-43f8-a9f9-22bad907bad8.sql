
-- Public buckets: drop broad SELECT policies so clients cannot LIST bucket contents.
-- Direct public CDN URLs still work because they bypass RLS.
DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Post videos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view professional photos" ON storage.objects;
