
DO $$ BEGIN CREATE TYPE public.staff_status AS ENUM ('active','on_leave','suspended','terminated','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.staff_gender AS ENUM ('male','female','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.staff_position AS ENUM ('principal','vice_principal','school_admin','form_teacher','subject_teacher','account_officer','receptionist','librarian','bursar','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.leave_status AS ENUM ('pending','approved','rejected','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.attendance_status AS ENUM ('present','absent','late','excused','remote'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  staff_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  gender public.staff_gender,
  date_of_birth DATE,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  photo_url TEXT,
  qualification TEXT,
  specialization TEXT,
  department TEXT,
  position public.staff_position NOT NULL DEFAULT 'other',
  employment_date DATE,
  salary NUMERIC(12,2),
  username TEXT,
  is_teaching BOOLEAN NOT NULL DEFAULT false,
  status public.staff_status NOT NULL DEFAULT 'active',
  status_note TEXT,
  status_changed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, staff_code)
);
CREATE INDEX idx_staff_school ON public.staff(school_id);
CREATE INDEX idx_staff_status ON public.staff(school_id, status);
CREATE INDEX idx_staff_position ON public.staff(school_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO authenticated;
GRANT ALL ON public.staff TO service_role;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view staff" ON public.staff FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "Admins can insert staff" ON public.staff FOR INSERT TO authenticated WITH CHECK (public.is_school_admin_of(school_id));
CREATE POLICY "Admins can update staff" ON public.staff FOR UPDATE TO authenticated USING (public.is_school_admin_of(school_id)) WITH CHECK (public.is_school_admin_of(school_id));
CREATE POLICY "Super admins can delete staff" ON public.staff FOR DELETE TO authenticated USING (public.is_super_admin());
CREATE TRIGGER trg_staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('subject','class','class_arm','department','club')),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  class_arm_id UUID REFERENCES public.class_arms(id) ON DELETE CASCADE,
  department TEXT,
  club_name TEXT,
  session_id UUID REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_staff_assign_school ON public.staff_assignments(school_id);
CREATE INDEX idx_staff_assign_staff ON public.staff_assignments(staff_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_assignments TO authenticated;
GRANT ALL ON public.staff_assignments TO service_role;
ALTER TABLE public.staff_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view assignments" ON public.staff_assignments FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "Admins manage assignments" ON public.staff_assignments FOR ALL TO authenticated USING (public.is_school_admin_of(school_id)) WITH CHECK (public.is_school_admin_of(school_id));
CREATE TRIGGER trg_staff_assign_updated_at BEFORE UPDATE ON public.staff_assignments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.staff_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status public.leave_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leave_school ON public.staff_leave_requests(school_id);
CREATE INDEX idx_leave_staff ON public.staff_leave_requests(staff_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_leave_requests TO authenticated;
GRANT ALL ON public.staff_leave_requests TO service_role;
ALTER TABLE public.staff_leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view leave" ON public.staff_leave_requests FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "Admins manage leave" ON public.staff_leave_requests FOR ALL TO authenticated USING (public.is_school_admin_of(school_id)) WITH CHECK (public.is_school_admin_of(school_id));
CREATE TRIGGER trg_leave_updated_at BEFORE UPDATE ON public.staff_leave_requests FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status public.attendance_status NOT NULL DEFAULT 'present',
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (staff_id, attendance_date)
);
CREATE INDEX idx_att_school_date ON public.staff_attendance(school_id, attendance_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_attendance TO authenticated;
GRANT ALL ON public.staff_attendance TO service_role;
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view attendance" ON public.staff_attendance FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "Admins manage attendance" ON public.staff_attendance FOR ALL TO authenticated USING (public.is_school_admin_of(school_id)) WITH CHECK (public.is_school_admin_of(school_id));
CREATE TRIGGER trg_att_updated_at BEFORE UPDATE ON public.staff_attendance FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.staff_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kind TEXT,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_staff_docs_staff ON public.staff_documents(staff_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_documents TO authenticated;
GRANT ALL ON public.staff_documents TO service_role;
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view staff docs" ON public.staff_documents FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "Admins manage staff docs" ON public.staff_documents FOR ALL TO authenticated USING (public.is_school_admin_of(school_id)) WITH CHECK (public.is_school_admin_of(school_id));
CREATE TRIGGER trg_staff_docs_updated_at BEFORE UPDATE ON public.staff_documents FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
