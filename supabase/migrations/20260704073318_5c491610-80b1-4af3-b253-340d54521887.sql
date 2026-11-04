
DO $$ BEGIN
  CREATE TYPE public.attendance_status AS ENUM ('present','absent','late','excused','medical','half_day');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.period_kind AS ENUM ('class','break','lunch','assembly','free');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  date date NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  arm_id uuid REFERENCES public.class_arms(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status public.attendance_status NOT NULL DEFAULT 'present',
  remark text,
  is_finalized boolean NOT NULL DEFAULT false,
  marked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  marked_at timestamptz NOT NULL DEFAULT now(),
  edited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_att_student_date_subject
  ON public.attendance_records(student_id, date, subject_id) WHERE subject_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_att_student_date_nosubject
  ON public.attendance_records(student_id, date) WHERE subject_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_att_school_date ON public.attendance_records(school_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_att_class_date ON public.attendance_records(class_id, arm_id, date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
GRANT ALL ON public.attendance_records TO service_role;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "att_select_members" ON public.attendance_records
  FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "att_insert_members" ON public.attendance_records
  FOR INSERT TO authenticated WITH CHECK (public.is_school_member(school_id));
CREATE POLICY "att_update_members" ON public.attendance_records
  FOR UPDATE TO authenticated USING (public.is_school_member(school_id))
  WITH CHECK (public.is_school_member(school_id));
CREATE POLICY "att_delete_admin" ON public.attendance_records
  FOR DELETE TO authenticated USING (public.is_school_admin_of(school_id));

CREATE TRIGGER trg_att_updated BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.attendance_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  record_id uuid NOT NULL REFERENCES public.attendance_records(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  old_status public.attendance_status,
  new_status public.attendance_status,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.attendance_audit TO authenticated;
GRANT ALL ON public.attendance_audit TO service_role;
ALTER TABLE public.attendance_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "att_audit_select" ON public.attendance_audit
  FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "att_audit_insert" ON public.attendance_audit
  FOR INSERT TO authenticated WITH CHECK (public.is_school_member(school_id));

CREATE TABLE IF NOT EXISTS public.timetable_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  arm_id uuid REFERENCES public.class_arms(id) ON DELETE SET NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  period_index smallint NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  kind public.period_kind NOT NULL DEFAULT 'class',
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  room text,
  color text,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tt_slot
  ON public.timetable_periods(class_id, arm_id, day_of_week, period_index, term_id);
CREATE INDEX IF NOT EXISTS idx_tt_school ON public.timetable_periods(school_id, term_id);
CREATE INDEX IF NOT EXISTS idx_tt_teacher ON public.timetable_periods(teacher_id, day_of_week);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_periods TO authenticated;
GRANT ALL ON public.timetable_periods TO service_role;
ALTER TABLE public.timetable_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tt_select_members" ON public.timetable_periods
  FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "tt_write_admin" ON public.timetable_periods
  FOR ALL TO authenticated
  USING (public.is_school_admin_of(school_id))
  WITH CHECK (public.is_school_admin_of(school_id));

CREATE TRIGGER trg_tt_updated BEFORE UPDATE ON public.timetable_periods
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.timetable_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  arm_id uuid REFERENCES public.class_arms(id) ON DELETE SET NULL,
  label text,
  snapshot jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.timetable_versions TO authenticated;
GRANT ALL ON public.timetable_versions TO service_role;
ALTER TABLE public.timetable_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ttv_select_members" ON public.timetable_versions
  FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "ttv_write_admin" ON public.timetable_versions
  FOR ALL TO authenticated
  USING (public.is_school_admin_of(school_id))
  WITH CHECK (public.is_school_admin_of(school_id));
