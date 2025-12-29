-- Create storage bucket for product photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-photos', 'product-photos', true);

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload product photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own product photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own product photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to product photos
CREATE POLICY "Public can view product photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-photos');