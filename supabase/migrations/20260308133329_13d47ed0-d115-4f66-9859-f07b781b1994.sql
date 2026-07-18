-- Add photo and AI detection fields to pickup_requests
ALTER TABLE public.pickup_requests 
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS ai_detected_type text,
  ADD COLUMN IF NOT EXISTS ai_estimated_weight numeric,
  ADD COLUMN IF NOT EXISTS ai_confidence numeric;

-- Create storage bucket for waste photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('waste-photos', 'waste-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to waste-photos
CREATE POLICY "Users upload waste photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'waste-photos');

-- Allow public read waste photos
CREATE POLICY "Public read waste photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'waste-photos');