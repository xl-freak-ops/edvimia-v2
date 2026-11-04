-- Fix: staff DELETE policy was restricted to super_admin only,
-- but INSERT and UPDATE already use is_school_admin_of(school_id).
-- School admins must be able to delete staff from their own school.
DROP POLICY IF EXISTS "Super admins can delete staff" ON public.staff;
CREATE POLICY "Admins can delete staff" ON public.staff
  FOR DELETE TO authenticated
  USING (public.is_school_admin_of(school_id));
