-- ── Lesson Videos Storage Bucket ──────────────────────────────
-- Creates a public storage bucket for self-hosted lesson videos
-- (replaces Vimeo/YouTube dependency for the Dersler section)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-videos',
  'lesson-videos',
  true,
  524288000,  -- 500 MB in bytes
  ARRAY['video/mp4','video/webm','video/quicktime','video/x-msvideo','video/mpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Allow service role full access
CREATE POLICY "service_lesson_videos_all"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'lesson-videos')
  WITH CHECK (bucket_id = 'lesson-videos');

-- Allow anon to read (stream videos without auth)
CREATE POLICY "anon_lesson_videos_read"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'lesson-videos');

-- Allow authenticated users to upload
CREATE POLICY "auth_lesson_videos_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'lesson-videos');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "auth_lesson_videos_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'lesson-videos');
