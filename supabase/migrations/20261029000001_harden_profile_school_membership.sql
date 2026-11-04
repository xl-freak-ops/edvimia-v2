-- Keep ordinary users from assigning themselves to a school through profiles.
-- Trusted workspace RPCs and the invitation Edge Function use privileged access.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, email, phone, avatar_url)
  ON public.profiles TO authenticated;

-- A self-created profile may not claim school membership either.
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id AND school_id IS NULL);

-- Membership is granted through scoped role assignment, not a self-editable
-- profile field. Unscoped roles do not satisfy this check.
CREATE OR REPLACE FUNCTION public.is_school_member(_school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND school_id = _school_id
    );
$$;
