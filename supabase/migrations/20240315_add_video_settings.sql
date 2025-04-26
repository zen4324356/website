-- Create video_settings table
CREATE TABLE IF NOT EXISTS public.video_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  video_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_active BOOLEAN DEFAULT false NOT NULL
);

-- Allow authenticated users to read video_settings
ALTER TABLE public.video_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anyone to read video_settings"
  ON public.video_settings
  FOR SELECT USING (true);

-- Only allow admins to insert/update/delete video_settings
CREATE POLICY "Allow admins to modify video_settings"
  ON public.video_settings
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE active = true))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE active = true));

-- Create the storage bucket for videos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to the videos bucket
CREATE POLICY "Allow public read access to videos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'videos');

-- Allow authenticated users to upload to videos bucket
CREATE POLICY "Allow authenticated users to upload videos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'videos'
    AND auth.role() = 'authenticated'
  );

-- Allow admins to delete from videos bucket
CREATE POLICY "Allow admins to delete videos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'videos'
    AND auth.uid() IN (SELECT user_id FROM public.admins WHERE active = true)
  ); 