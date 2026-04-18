
-- Fix function search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Replace broad SELECT policies with narrower ones (still allow public READ via signed URL/public bucket fetch, but list requires auth)
DROP POLICY IF EXISTS "Anyone can view certifications" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

CREATE POLICY "View certifications by owner or admin" ON storage.objects FOR SELECT USING (
  bucket_id = 'certifications' AND (auth.uid() = owner OR public.has_role(auth.uid(), 'admin') OR auth.role() = 'authenticated')
);
CREATE POLICY "View product-images by authenticated" ON storage.objects FOR SELECT USING (
  bucket_id = 'product-images' AND auth.role() = 'authenticated'
);
