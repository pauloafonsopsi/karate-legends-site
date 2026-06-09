-- Add verso column for athlete ID document
ALTER TABLE public.inscricoes_atletas ADD COLUMN IF NOT EXISTS link_documento_verso text;

-- Storage policies for atletas-docs bucket
CREATE POLICY "Public can upload to atletas-docs"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'atletas-docs');

CREATE POLICY "Admins can read atletas-docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'atletas-docs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete atletas-docs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'atletas-docs' AND public.has_role(auth.uid(), 'admin'));