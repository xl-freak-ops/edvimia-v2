
-- Atomic school workspace creation for the currently authenticated user.
-- Runs as SECURITY DEFINER so it succeeds even when RLS would otherwise
-- block a fresh user from writing across profiles / user_roles / schools.
CREATE OR REPLACE FUNCTION public.create_school_workspace(
  _name          text,
  _school_type   text DEFAULT 'secondary',
  _country       text DEFAULT 'Nigeria',
  _state         text DEFAULT NULL,
  _address       text DEFAULT NULL,
  _email         text DEFAULT NULL,
  _phone         text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _user_email text;
  _existing_school uuid;
  _new_school uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF _name IS NULL OR length(btrim(_name)) < 2 THEN
    RAISE EXCEPTION 'School name is required';
  END IF;

  -- Prevent the same user creating two workspaces.
  SELECT school_id INTO _existing_school FROM public.profiles WHERE id = _uid;
  IF _existing_school IS NOT NULL THEN
    RETURN _existing_school;
  END IF;

  -- Prevent duplicate schools (same name + country, case-insensitive).
  SELECT id INTO _new_school
  FROM public.schools
  WHERE lower(name) = lower(btrim(_name))
    AND lower(coalesce(country,'')) = lower(coalesce(_country,''))
  LIMIT 1;
  IF _new_school IS NOT NULL THEN
    RAISE EXCEPTION 'A school with this name already exists in %', _country
      USING ERRCODE = '23505';
  END IF;

  -- Ensure profile row exists (trigger normally handles this).
  SELECT email INTO _user_email FROM auth.users WHERE id = _uid;
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (_uid, coalesce(_user_email, 'User'), _user_email)
  ON CONFLICT (id) DO NOTHING;

  -- Create the school.
  INSERT INTO public.schools (name, school_type, country, state, address, email, phone)
  VALUES (btrim(_name), coalesce(_school_type,'secondary'), coalesce(_country,'Nigeria'),
          _state, _address, _email, _phone)
  RETURNING id INTO _new_school;

  -- Attach the profile to the new school.
  UPDATE public.profiles SET school_id = _new_school WHERE id = _uid;

  -- Guarantee school_admin role scoped to this school. Remove any stray
  -- unscoped default rows the trigger may have inserted.
  DELETE FROM public.user_roles
   WHERE user_id = _uid AND role IN ('student','school_admin') AND school_id IS NULL;

  INSERT INTO public.user_roles (user_id, role, school_id)
  VALUES (_uid, 'school_admin', _new_school)
  ON CONFLICT DO NOTHING;

  RETURN _new_school;
END;
$$;

REVOKE ALL ON FUNCTION public.create_school_workspace(text,text,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_school_workspace(text,text,text,text,text,text,text) TO authenticated;

-- Update ensure_my_workspace to also clean up duplicate unscoped role rows.
CREATE OR REPLACE FUNCTION public.ensure_my_workspace(_school_name text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _school_id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT email, school_id INTO _email, _school_id FROM public.profiles WHERE id = _uid;
  IF NOT FOUND THEN
    SELECT email INTO _email FROM auth.users WHERE id = _uid;
    INSERT INTO public.profiles (id, full_name, email) VALUES (_uid, coalesce(_email,'User'), _email);
  END IF;

  IF _school_id IS NULL THEN
    _school_id := public.create_school_workspace(coalesce(nullif(_school_name,''), 'My School'));
  ELSIF NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _uid AND school_id = _school_id
  ) THEN
    RAISE EXCEPTION 'No role is assigned for this school workspace';
  END IF;

  RETURN _school_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_my_workspace(text) TO authenticated;

-- Tighten schools INSERT: require an authenticated caller AND either come
-- through the SECURITY DEFINER RPC (which bypasses this) or ensure the user
-- has no school yet. Prevents users from creating additional workspaces.
DROP POLICY IF EXISTS "Authenticated can create school" ON public.schools;
CREATE POLICY "Authenticated create first school"
  ON public.schools FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.school_id IS NOT NULL
    )
  );

-- Ensure the auth trigger is wired (safe re-attach).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
