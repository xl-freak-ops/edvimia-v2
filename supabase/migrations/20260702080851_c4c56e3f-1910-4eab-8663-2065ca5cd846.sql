-- Storage RLS for staff-assets bucket (private, school-scoped)
-- Path format: {school_id}/{staff_id}/{kind}-{timestamp}.{ext}

CREATE POLICY "staff_assets_read" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'staff-assets'
  AND public.is_school_member((storage.foldername(name))[1]::uuid)
);

CREATE POLICY "staff_assets_write" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'staff-assets'
  AND public.is_school_admin_of((storage.foldername(name))[1]::uuid)
);

CREATE POLICY "staff_assets_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'staff-assets'
  AND public.is_school_admin_of((storage.foldername(name))[1]::uuid)
);

CREATE POLICY "staff_assets_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'staff-assets'
  AND public.is_school_admin_of((storage.foldername(name))[1]::uuid)
);
