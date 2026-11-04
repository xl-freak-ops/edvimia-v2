
-- =========================================================
-- Result Management Module
-- =========================================================

DO $$ BEGIN
  CREATE TYPE public.result_workflow_status AS ENUM
    ('draft','pending_review','approved','published','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.promotion_status AS ENUM
    ('promoted','repeat','conditional','graduated','pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- assessment components ----------
CREATE TABLE IF NOT EXISTS public.assessment_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  weight numeric(5,2) NOT NULL DEFAULT 0,
  max_score numeric(6,2) NOT NULL DEFAULT 100,
  is_enabled boolean NOT NULL DEFAULT true,
  is_exam boolean NOT NULL DEFAULT false,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_components TO authenticated;
GRANT ALL ON public.assessment_components TO service_role;
ALTER TABLE public.assessment_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view assessments" ON public.assessment_components
  FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "admins manage assessments" ON public.assessment_components
  FOR ALL TO authenticated
  USING (public.is_school_admin_of(school_id))
  WITH CHECK (public.is_school_admin_of(school_id));

CREATE TRIGGER trg_assessment_components_updated
  BEFORE UPDATE ON public.assessment_components
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- result sheets ----------
CREATE TABLE IF NOT EXISTS public.result_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  arm_id uuid REFERENCES public.class_arms(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  status public.result_workflow_status NOT NULL DEFAULT 'draft',
  teacher_comment text,
  review_notes text,
  rejected_reason text,
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  published_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, term_id, class_id, arm_id, subject_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.result_sheets TO authenticated;
GRANT ALL ON public.result_sheets TO service_role;
ALTER TABLE public.result_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view sheets" ON public.result_sheets
  FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "teachers create sheets" ON public.result_sheets
  FOR INSERT TO authenticated
  WITH CHECK (public.is_school_member(school_id));
CREATE POLICY "teachers update own sheets" ON public.result_sheets
  FOR UPDATE TO authenticated
  USING (public.is_school_member(school_id)
    AND (public.is_school_admin_of(school_id) OR created_by = auth.uid() OR submitted_by = auth.uid()))
  WITH CHECK (public.is_school_member(school_id));
CREATE POLICY "admins delete sheets" ON public.result_sheets
  FOR DELETE TO authenticated USING (public.is_school_admin_of(school_id));

CREATE TRIGGER trg_result_sheets_updated
  BEFORE UPDATE ON public.result_sheets
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_result_sheets_school ON public.result_sheets(school_id, term_id);
CREATE INDEX IF NOT EXISTS idx_result_sheets_status ON public.result_sheets(status);

-- ---------- result scores ----------
CREATE TABLE IF NOT EXISTS public.result_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  sheet_id uuid REFERENCES public.result_sheets(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  arm_id uuid REFERENCES public.class_arms(id) ON DELETE SET NULL,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  component_id uuid NOT NULL REFERENCES public.assessment_components(id) ON DELETE CASCADE,
  score numeric(6,2),
  entered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject_id, term_id, component_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.result_scores TO authenticated;
GRANT ALL ON public.result_scores TO service_role;
ALTER TABLE public.result_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view scores" ON public.result_scores
  FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "members write scores" ON public.result_scores
  FOR INSERT TO authenticated WITH CHECK (public.is_school_member(school_id));
CREATE POLICY "members update scores" ON public.result_scores
  FOR UPDATE TO authenticated
  USING (public.is_school_member(school_id))
  WITH CHECK (public.is_school_member(school_id));
CREATE POLICY "members delete scores" ON public.result_scores
  FOR DELETE TO authenticated USING (public.is_school_member(school_id));

CREATE TRIGGER trg_result_scores_updated
  BEFORE UPDATE ON public.result_scores
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_result_scores_lookup
  ON public.result_scores(school_id, term_id, class_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_result_scores_student
  ON public.result_scores(student_id, term_id);

-- ---------- result meta (per student per term overall) ----------
CREATE TABLE IF NOT EXISTS public.result_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  arm_id uuid REFERENCES public.class_arms(id) ON DELETE SET NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  attendance_present int,
  attendance_absent int,
  attendance_total int,
  form_teacher_comment text,
  principal_comment text,
  promotion public.promotion_status DEFAULT 'pending',
  next_resumption date,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  published_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, term_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.result_meta TO authenticated;
GRANT ALL ON public.result_meta TO service_role;
ALTER TABLE public.result_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view meta" ON public.result_meta
  FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "admins manage meta" ON public.result_meta
  FOR ALL TO authenticated
  USING (public.is_school_admin_of(school_id))
  WITH CHECK (public.is_school_admin_of(school_id));

CREATE TRIGGER trg_result_meta_updated
  BEFORE UPDATE ON public.result_meta
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- audit ----------
CREATE TABLE IF NOT EXISTS public.result_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  sheet_id uuid REFERENCES public.result_sheets(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  action text NOT NULL,
  from_status public.result_workflow_status,
  to_status public.result_workflow_status,
  note text,
  actor uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.result_audit TO authenticated;
GRANT ALL ON public.result_audit TO service_role;
ALTER TABLE public.result_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view audit" ON public.result_audit
  FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "members insert audit" ON public.result_audit
  FOR INSERT TO authenticated WITH CHECK (public.is_school_member(school_id));

-- ---------- helper: seed default assessment components for a school ----------
CREATE OR REPLACE FUNCTION public.seed_default_assessments(_school_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_school_admin_of(_school_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  INSERT INTO public.assessment_components (school_id, code, name, weight, max_score, is_exam, display_order)
  VALUES
    (_school_id, 'CA1', 'CA 1', 10, 10, false, 1),
    (_school_id, 'CA2', 'CA 2', 10, 10, false, 2),
    (_school_id, 'ASSIGN', 'Assignment', 10, 10, false, 3),
    (_school_id, 'PROJECT', 'Project', 10, 10, false, 4),
    (_school_id, 'EXAM', 'Examination', 60, 60, true, 5)
  ON CONFLICT (school_id, code) DO NOTHING;
END $$;
