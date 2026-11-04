
-- 1. Extend schools
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS motto text,
  ADD COLUMN IF NOT EXISTS lga text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS principal_name text,
  ADD COLUMN IF NOT EXISTS vice_principal_name text,
  ADD COLUMN IF NOT EXISTS administrator_name text,
  ADD COLUMN IF NOT EXISTS school_time_start time,
  ADD COLUMN IF NOT EXISTS school_time_end time,
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#2563EB',
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#F97316',
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Africa/Lagos',
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'NGN',
  ADD COLUMN IF NOT EXISTS resumption_date date,
  ADD COLUMN IF NOT EXISTS closing_date date;

-- 2. Helper functions for tenant isolation
CREATE OR REPLACE FUNCTION public.is_school_member(_school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = _school_id)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND school_id = _school_id);
$$;

CREATE OR REPLACE FUNCTION public.is_school_admin_of(_school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND school_id = _school_id
        AND role IN ('school_admin','principal','vice_principal')
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.user_roles ur ON ur.user_id = p.id
      WHERE p.id = auth.uid() AND p.school_id = _school_id
        AND ur.role IN ('school_admin','principal','vice_principal')
    );
$$;

REVOKE EXECUTE ON FUNCTION public.is_school_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_school_admin_of(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_school_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_school_admin_of(uuid) TO authenticated;

-- 3. Academic sessions
CREATE TABLE IF NOT EXISTS public.academic_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date,
  end_date date,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_sessions TO authenticated;
GRANT ALL ON public.academic_sessions TO service_role;
ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view sessions" ON public.academic_sessions FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "Admins insert sessions" ON public.academic_sessions FOR INSERT TO authenticated WITH CHECK (public.is_school_admin_of(school_id));
CREATE POLICY "Admins update sessions" ON public.academic_sessions FOR UPDATE TO authenticated USING (public.is_school_admin_of(school_id)) WITH CHECK (public.is_school_admin_of(school_id));
CREATE POLICY "Admins delete sessions" ON public.academic_sessions FOR DELETE TO authenticated USING (public.is_school_admin_of(school_id));
CREATE TRIGGER tg_academic_sessions_updated BEFORE UPDATE ON public.academic_sessions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 4. Terms
CREATE TABLE IF NOT EXISTS public.terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date,
  end_date date,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.terms TO authenticated;
GRANT ALL ON public.terms TO service_role;
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view terms" ON public.terms FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "Admins insert terms" ON public.terms FOR INSERT TO authenticated WITH CHECK (public.is_school_admin_of(school_id));
CREATE POLICY "Admins update terms" ON public.terms FOR UPDATE TO authenticated USING (public.is_school_admin_of(school_id)) WITH CHECK (public.is_school_admin_of(school_id));
CREATE POLICY "Admins delete terms" ON public.terms FOR DELETE TO authenticated USING (public.is_school_admin_of(school_id));
CREATE TRIGGER tg_terms_updated BEFORE UPDATE ON public.terms FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 5. Sections
CREATE TABLE IF NOT EXISTS public.sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sections TO authenticated;
GRANT ALL ON public.sections TO service_role;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view sections" ON public.sections FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "Admins manage sections" ON public.sections FOR ALL TO authenticated USING (public.is_school_admin_of(school_id)) WITH CHECK (public.is_school_admin_of(school_id));
CREATE TRIGGER tg_sections_updated BEFORE UPDATE ON public.sections FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 6. Classes
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view classes" ON public.classes FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "Admins manage classes" ON public.classes FOR ALL TO authenticated USING (public.is_school_admin_of(school_id)) WITH CHECK (public.is_school_admin_of(school_id));
CREATE TRIGGER tg_classes_updated BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 7. Class arms
CREATE TABLE IF NOT EXISTS public.class_arms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_arms TO authenticated;
GRANT ALL ON public.class_arms TO service_role;
ALTER TABLE public.class_arms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view arms" ON public.class_arms FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "Admins manage arms" ON public.class_arms FOR ALL TO authenticated USING (public.is_school_admin_of(school_id)) WITH CHECK (public.is_school_admin_of(school_id));
CREATE TRIGGER tg_class_arms_updated BEFORE UPDATE ON public.class_arms FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 8. Subjects
DO $$ BEGIN
  CREATE TYPE public.subject_category AS ENUM ('core','elective','practical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  department text,
  category public.subject_category NOT NULL DEFAULT 'core',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view subjects" ON public.subjects FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "Admins manage subjects" ON public.subjects FOR ALL TO authenticated USING (public.is_school_admin_of(school_id)) WITH CHECK (public.is_school_admin_of(school_id));
CREATE TRIGGER tg_subjects_updated BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 9. Grade scales
CREATE TABLE IF NOT EXISTS public.grade_scales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  grade text NOT NULL,
  min_score numeric(5,2) NOT NULL,
  max_score numeric(5,2) NOT NULL,
  remark text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, grade)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grade_scales TO authenticated;
GRANT ALL ON public.grade_scales TO service_role;
ALTER TABLE public.grade_scales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view grades" ON public.grade_scales FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "Admins manage grades" ON public.grade_scales FOR ALL TO authenticated USING (public.is_school_admin_of(school_id)) WITH CHECK (public.is_school_admin_of(school_id));
CREATE TRIGGER tg_grade_scales_updated BEFORE UPDATE ON public.grade_scales FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 10. School settings (single row per school)
CREATE TABLE IF NOT EXISTS public.school_settings (
  school_id uuid PRIMARY KEY REFERENCES public.schools(id) ON DELETE CASCADE,
  attendance jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  promotion jsonb NOT NULL DEFAULT '{}'::jsonb,
  sms jsonb NOT NULL DEFAULT '{}'::jsonb,
  email jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_settings TO authenticated;
GRANT ALL ON public.school_settings TO service_role;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view settings" ON public.school_settings FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "Admins manage settings" ON public.school_settings FOR ALL TO authenticated USING (public.is_school_admin_of(school_id)) WITH CHECK (public.is_school_admin_of(school_id));
CREATE TRIGGER tg_school_settings_updated BEFORE UPDATE ON public.school_settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
