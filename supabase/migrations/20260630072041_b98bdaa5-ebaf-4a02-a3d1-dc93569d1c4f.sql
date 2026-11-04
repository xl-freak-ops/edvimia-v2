
CREATE POLICY "School members view assets" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'school-assets' AND public.is_school_member(((storage.foldername(name))[1])::uuid));

CREATE POLICY "School admins upload assets" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'school-assets' AND public.is_school_admin_of(((storage.foldername(name))[1])::uuid));

CREATE POLICY "School admins update assets" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'school-assets' AND public.is_school_admin_of(((storage.foldername(name))[1])::uuid))
WITH CHECK (bucket_id = 'school-assets' AND public.is_school_admin_of(((storage.foldername(name))[1])::uuid));

CREATE POLICY "School admins delete assets" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'school-assets' AND public.is_school_admin_of(((storage.foldername(name))[1])::uuid));
