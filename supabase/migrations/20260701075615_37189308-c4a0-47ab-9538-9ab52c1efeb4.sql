
-- Enums
DO $$ BEGIN
  CREATE TYPE public.student_status AS ENUM ('active','graduated','transferred','suspended','withdrawn','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.student_gender AS ENUM ('male','female','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Students
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  admission_number TEXT NOT NULL,
  student_code TEXT NOT NULL,
  photo_url TEXT,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  surname TEXT NOT NULL,
  gender public.student_gender NOT NULL,
  date_of_birth DATE,
  religion TEXT,
  nationality TEXT DEFAULT 'Nigerian',
  state_of_origin TEXT,
  lga TEXT,
  home_address TEXT,
  blood_group TEXT,
  genotype TEXT,
  medical_conditions TEXT,
  disabilities TEXT,
  previous_school TEXT,
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  arm_id UUID REFERENCES public.class_arms(id) ON DELETE SET NULL,
  house TEXT,
  transport_route TEXT,
  hostel TEXT,
  status public.student_status NOT NULL DEFAULT 'active',
  status_note TEXT,
  status_changed_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, admission_number),
  UNIQUE (school_id, student_code)
);
CREATE INDEX IF NOT EXISTS students_school_idx ON public.students(school_id);
CREATE INDEX IF NOT EXISTS students_class_idx ON public.students(class_id);
CREATE INDEX IF NOT EXISTS students_status_idx ON public.students(status);
CREATE INDEX IF NOT EXISTS students_name_idx ON public.students(school_id, surname, first_name);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view students" ON public.students FOR SELECT TO authenticated
  USING (public.is_school_member(school_id));
CREATE POLICY "admins insert students" ON public.students FOR INSERT TO authenticated
  WITH CHECK (public.is_school_admin_of(school_id));
CREATE POLICY "admins update students" ON public.students FOR UPDATE TO authenticated
  USING (public.is_school_admin_of(school_id))
  WITH CHECK (public.is_school_admin_of(school_id));
CREATE POLICY "super admin deletes students" ON public.students FOR DELETE TO authenticated
  USING (public.is_super_admin());

CREATE TRIGGER students_set_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Guardians
CREATE TABLE IF NOT EXISTS public.student_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL,
  full_name TEXT NOT NULL,
  occupation TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  is_emergency BOOLEAN NOT NULL DEFAULT false,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS guardians_student_idx ON public.student_guardians(student_id);
CREATE INDEX IF NOT EXISTS guardians_school_idx ON public.student_guardians(school_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_guardians TO authenticated;
GRANT ALL ON public.student_guardians TO service_role;

ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members view guardians" ON public.student_guardians FOR SELECT TO authenticated
  USING (public.is_school_member(school_id));
CREATE POLICY "admins manage guardians" ON public.student_guardians FOR ALL TO authenticated
  USING (public.is_school_admin_of(school_id))
  WITH CHECK (public.is_school_admin_of(school_id));

CREATE TRIGGER guardians_set_updated_at BEFORE UPDATE ON public.student_guardians
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Documents
CREATE TABLE IF NOT EXISTS public.student_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  content_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS docs_student_idx ON public.student_documents(student_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_documents TO authenticated;
GRANT ALL ON public.student_documents TO service_role;

ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members view docs" ON public.student_documents FOR SELECT TO authenticated
  USING (public.is_school_member(school_id));
CREATE POLICY "admins manage docs" ON public.student_documents FOR ALL TO authenticated
  USING (public.is_school_admin_of(school_id))
  WITH CHECK (public.is_school_admin_of(school_id));

-- Status History
CREATE TABLE IF NOT EXISTS public.student_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  from_status public.student_status,
  to_status public.student_status,
  from_class_id UUID,
  to_class_id UUID,
  note TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS status_hist_student_idx ON public.student_status_history(student_id);

GRANT SELECT, INSERT ON public.student_status_history TO authenticated;
GRANT ALL ON public.student_status_history TO service_role;

ALTER TABLE public.student_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members view history" ON public.student_status_history FOR SELECT TO authenticated
  USING (public.is_school_member(school_id));
CREATE POLICY "admins insert history" ON public.student_status_history FOR INSERT TO authenticated
  WITH CHECK (public.is_school_admin_of(school_id));

-- Storage policies for student-assets bucket ({school_id}/...)
CREATE POLICY "student assets read" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-assets'
    AND public.is_school_member(((storage.foldername(name))[1])::uuid)
  );
CREATE POLICY "student assets write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'student-assets'
    AND public.is_school_admin_of(((storage.foldername(name))[1])::uuid)
  );
CREATE POLICY "student assets update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'student-assets'
    AND public.is_school_admin_of(((storage.foldername(name))[1])::uuid)
  );
CREATE POLICY "student assets delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'student-assets'
    AND public.is_school_admin_of(((storage.foldername(name))[1])::uuid)
  );
