
-- Add reaction_type to post_likes
ALTER TABLE public.post_likes ADD COLUMN IF NOT EXISTS reaction_type text NOT NULL DEFAULT 'heart';

-- Replace unique constraint to include reaction_type
ALTER TABLE public.post_likes DROP CONSTRAINT IF EXISTS post_likes_user_id_post_id_key;
ALTER TABLE public.post_likes ADD CONSTRAINT post_likes_user_post_reaction_key UNIQUE (user_id, post_id, reaction_type);

-- Add video_url to community_posts
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS video_url text;

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-videos', 'post-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for post-videos
DROP POLICY IF EXISTS "Post videos are publicly accessible" ON storage.objects;
CREATE POLICY "Post videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-videos');

DROP POLICY IF EXISTS "Users can upload own post videos" ON storage.objects;
CREATE POLICY "Users can upload own post videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own post videos" ON storage.objects;
CREATE POLICY "Users can delete own post videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'post-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
