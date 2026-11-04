-- Trust only a student's own account or an administrator-provisioned
-- parent/student link for portal access to student records.
CREATE OR REPLACE FUNCTION public.is_student_or_guardian_of(
  _student_id uuid,
  _school_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.id = _student_id
        AND s.school_id = _school_id
        AND (
          (
            s.user_id = auth.uid()
            AND EXISTS (
              SELECT 1
              FROM public.user_roles ur
              WHERE ur.user_id = auth.uid()
                AND ur.school_id = s.school_id
                AND ur.role = 'student'
            )
          )
          OR EXISTS (
            SELECT 1
            FROM public.parent_student_links psl
            JOIN public.user_roles ur
              ON ur.user_id = psl.parent_user_id
             AND ur.school_id = psl.school_id
            WHERE psl.student_id = s.id
              AND psl.school_id = s.school_id
              AND psl.parent_user_id = auth.uid()
              AND ur.role = 'parent'
          )
          OR (
            s.email IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM public.parent_student_links psl
              JOIN public.user_roles ur
                ON ur.user_id = psl.parent_user_id
               AND ur.school_id = psl.school_id
              JOIN auth.users au ON au.id = auth.uid()
              WHERE psl.student_id = s.id
                AND psl.school_id = s.school_id
                AND psl.parent_user_id = auth.uid()
                AND lower(psl.relationship) = 'self'
                AND lower(au.email) = lower(s.email)
                AND ur.role = 'student'
            )
          )
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_student_record(
  _student_id uuid,
  _school_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_school_admin_of(_school_id)
    OR public.is_student_or_guardian_of(_student_id, _school_id)
    OR EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.user_roles ur
        ON ur.user_id = auth.uid()
       AND ur.school_id = s.school_id
      JOIN public.staff st
        ON st.user_id = ur.user_id
       AND st.school_id = ur.school_id
      JOIN public.staff_assignments sa
        ON sa.staff_id = st.id
       AND sa.school_id = st.school_id
      WHERE s.id = _student_id
        AND s.school_id = _school_id
        AND ur.role IN ('form_teacher', 'subject_teacher')
        AND st.status = 'active'
        AND st.is_teaching
        AND EXISTS (
          SELECT 1
          FROM public.classes c
          WHERE c.id = s.class_id
            AND c.school_id = s.school_id
        )
        AND (
          s.arm_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.class_arms ca
            WHERE ca.id = s.arm_id
              AND ca.school_id = s.school_id
              AND ca.class_id = s.class_id
          )
        )
        AND (
          sa.session_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.academic_sessions acs
            WHERE acs.id = sa.session_id
              AND acs.school_id = s.school_id
              AND acs.is_current
          )
        )
        AND (
          (
            sa.assignment_type = 'class'
            AND sa.class_id = s.class_id
            AND (sa.class_arm_id IS NULL OR sa.class_arm_id IS NOT DISTINCT FROM s.arm_id)
          )
          OR (
            sa.assignment_type = 'class_arm'
            AND s.arm_id IS NOT NULL
            AND sa.class_arm_id = s.arm_id
            AND EXISTS (
              SELECT 1
              FROM public.class_arms ca
              WHERE ca.id = sa.class_arm_id
                AND ca.school_id = s.school_id
                AND ca.class_id = s.class_id
            )
          )
          OR (
            ur.role = 'subject_teacher'
            AND sa.assignment_type = 'subject'
            AND sa.subject_id IS NOT NULL
            AND sa.class_id = s.class_id
            AND (sa.class_arm_id IS NULL OR sa.class_arm_id IS NOT DISTINCT FROM s.arm_id)
          )
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.homework_scope_is_valid(
  _school_id uuid,
  _class_id uuid,
  _arm_id uuid,
  _subject_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classes c
    JOIN public.subjects sub
      ON sub.id = _subject_id
     AND sub.school_id = _school_id
    WHERE c.id = _class_id
      AND c.school_id = _school_id
      AND (
        _arm_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.class_arms ca
          WHERE ca.id = _arm_id
            AND ca.school_id = _school_id
            AND ca.class_id = _class_id
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_homework_scope(
  _school_id uuid,
  _class_id uuid,
  _arm_id uuid,
  _subject_id uuid,
  _teacher_id uuid,
  _allow_direct_assignment boolean
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_school_admin_of(_school_id)
    OR (
      public.homework_scope_is_valid(_school_id, _class_id, _arm_id, _subject_id)
      AND EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.staff st
          ON st.user_id = ur.user_id
         AND st.school_id = ur.school_id
        WHERE ur.user_id = auth.uid()
          AND ur.school_id = _school_id
          AND ur.role IN ('form_teacher', 'subject_teacher')
          AND st.status = 'active'
          AND st.is_teaching
          AND (
            (_allow_direct_assignment AND _teacher_id = st.id)
            OR (
              (
                _allow_direct_assignment
                OR _teacher_id IS NULL
                OR _teacher_id = st.id
              )
              AND EXISTS (
                SELECT 1
                FROM public.staff_assignments sa
                WHERE sa.staff_id = st.id
                  AND sa.school_id = _school_id
                  AND (
                    sa.session_id IS NULL
                    OR EXISTS (
                      SELECT 1
                      FROM public.academic_sessions acs
                      WHERE acs.id = sa.session_id
                        AND acs.school_id = _school_id
                        AND acs.is_current
                    )
                  )
                  AND (
                    (
                      sa.assignment_type = 'subject'
                      AND ur.role = 'subject_teacher'
                      AND sa.subject_id = _subject_id
                      AND (sa.class_id IS NULL OR sa.class_id = _class_id)
                      AND (sa.class_arm_id IS NULL OR sa.class_arm_id IS NOT DISTINCT FROM _arm_id)
                    )
                    OR (
                      sa.assignment_type = 'class'
                      AND sa.class_id = _class_id
                      AND (sa.class_arm_id IS NULL OR sa.class_arm_id IS NOT DISTINCT FROM _arm_id)
                    )
                    OR (
                      sa.assignment_type = 'class_arm'
                      AND _arm_id IS NOT NULL
                      AND sa.class_arm_id = _arm_id
                      AND EXISTS (
                        SELECT 1
                        FROM public.class_arms ca
                        WHERE ca.id = sa.class_arm_id
                          AND ca.school_id = _school_id
                          AND ca.class_id = _class_id
                      )
                    )
                  )
              )
            )
          )
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_homework_record(
  _homework_id uuid,
  _school_id uuid,
  _allow_direct_assignment boolean
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.homework h
    WHERE h.id = _homework_id
      AND h.school_id = _school_id
      AND public.can_manage_homework_scope(
        h.school_id,
        h.class_id,
        h.arm_id,
        h.subject_id,
        h.teacher_id,
        _allow_direct_assignment
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_student_or_guardian_of(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_access_student_record(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.homework_scope_is_valid(uuid, uuid, uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_homework_scope(uuid, uuid, uuid, uuid, uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_homework_record(uuid, uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_student_or_guardian_of(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_student_record(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.homework_scope_is_valid(uuid, uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_homework_scope(uuid, uuid, uuid, uuid, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_homework_record(uuid, uuid, boolean) TO authenticated;

-- Restrict student records to admins, the linked student/guardian, or assigned
-- teachers. The admin FOR ALL policies below remain limited to matching schools.
DROP POLICY IF EXISTS "members view students" ON public.students;
CREATE POLICY "members view students"
  ON public.students FOR SELECT TO authenticated
  USING (public.can_access_student_record(id, school_id));

DROP POLICY IF EXISTS "members view guardians" ON public.student_guardians;
CREATE POLICY "members view guardians"
  ON public.student_guardians FOR SELECT TO authenticated
  USING (public.can_access_student_record(student_id, school_id));

DROP POLICY IF EXISTS "admins manage guardians" ON public.student_guardians;
CREATE POLICY "admins manage guardians"
  ON public.student_guardians FOR ALL TO authenticated
  USING (
    public.is_school_admin_of(school_id)
    AND public.can_access_student_record(student_id, school_id)
  )
  WITH CHECK (
    public.is_school_admin_of(school_id)
    AND public.can_access_student_record(student_id, school_id)
  );

DROP POLICY IF EXISTS "members view docs" ON public.student_documents;
CREATE POLICY "members view docs"
  ON public.student_documents FOR SELECT TO authenticated
  USING (public.can_access_student_record(student_id, school_id));

DROP POLICY IF EXISTS "admins manage docs" ON public.student_documents;
CREATE POLICY "admins manage docs"
  ON public.student_documents FOR ALL TO authenticated
  USING (
    public.is_school_admin_of(school_id)
    AND public.can_access_student_record(student_id, school_id)
  )
  WITH CHECK (
    public.is_school_admin_of(school_id)
    AND public.can_access_student_record(student_id, school_id)
  );

DROP POLICY IF EXISTS "members view history" ON public.student_status_history;
CREATE POLICY "members view history"
  ON public.student_status_history FOR SELECT TO authenticated
  USING (public.can_access_student_record(student_id, school_id));

DROP POLICY IF EXISTS "admins insert history" ON public.student_status_history;
CREATE POLICY "admins insert history"
  ON public.student_status_history FOR INSERT TO authenticated
  WITH CHECK (
    public.is_school_admin_of(school_id)
    AND public.can_access_student_record(student_id, school_id)
  );

-- Student assets use {school_id}/{student_id}/... paths.
DROP POLICY IF EXISTS "student assets read" ON storage.objects;
CREATE POLICY "student assets read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    CASE
      WHEN bucket_id = 'student-assets'
        AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN public.can_access_student_record(
        ((storage.foldername(name))[2])::uuid,
        ((storage.foldername(name))[1])::uuid
      )
      ELSE false
    END
  );

-- Links are the portal's student/guardian relationship. Only school admins or
-- trusted SECURITY DEFINER/service-role invitation flows may create them.
DROP POLICY IF EXISTS "Admin manages parent links" ON public.parent_student_links;
CREATE POLICY "Admin manages parent links"
  ON public.parent_student_links FOR INSERT TO authenticated
  WITH CHECK (
    public.is_school_admin_of(school_id)
    AND EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.id = parent_student_links.student_id
        AND s.school_id = parent_student_links.school_id
    )
  );

-- Parents/students see only published homework for their linked student's
-- current class/arm; teachers need an active, school-scoped matching assignment.
DROP POLICY IF EXISTS "School members read published homework" ON public.homework;
CREATE POLICY "School members read published homework"
  ON public.homework FOR SELECT TO authenticated
  USING (
    public.is_school_admin_of(school_id)
    OR public.can_manage_homework_scope(
      school_id, class_id, arm_id, subject_id, teacher_id, true
    )
    OR (
      is_published
      AND public.homework_scope_is_valid(school_id, class_id, arm_id, subject_id)
      AND EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.school_id = homework.school_id
          AND s.class_id = homework.class_id
          AND (homework.arm_id IS NULL OR homework.arm_id = s.arm_id)
          AND public.is_student_or_guardian_of(s.id, s.school_id)
      )
    )
  );

DROP POLICY IF EXISTS "Staff create homework" ON public.homework;
CREATE POLICY "Staff create homework"
  ON public.homework FOR INSERT TO authenticated
  WITH CHECK (
    public.homework_scope_is_valid(school_id, class_id, arm_id, subject_id)
    AND (
      public.is_school_admin_of(school_id)
      OR public.can_manage_homework_scope(
        school_id, class_id, arm_id, subject_id, teacher_id, false
      )
    )
  );

DROP POLICY IF EXISTS "Teacher or admin update homework" ON public.homework;
CREATE POLICY "Teacher or admin update homework"
  ON public.homework FOR UPDATE TO authenticated
  USING (
    public.is_school_admin_of(school_id)
    OR public.can_manage_homework_scope(
      school_id, class_id, arm_id, subject_id, teacher_id, true
    )
  )
  WITH CHECK (
    public.is_school_admin_of(school_id)
    OR (
      public.homework_scope_is_valid(school_id, class_id, arm_id, subject_id)
      AND public.can_manage_homework_scope(
        school_id, class_id, arm_id, subject_id, teacher_id, true
      )
    )
  );

-- Submission access requires a matching student/homework school relationship.
DROP POLICY IF EXISTS "Student views own submissions; teacher/admin views class"
  ON public.homework_submissions;
CREATE POLICY "Student views own submissions; teacher/admin views class"
  ON public.homework_submissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.homework h
        ON h.id = homework_submissions.homework_id
       AND h.school_id = homework_submissions.school_id
      WHERE s.id = homework_submissions.student_id
        AND s.school_id = homework_submissions.school_id
        AND (
          public.is_school_admin_of(homework_submissions.school_id)
          OR public.is_student_or_guardian_of(s.id, s.school_id)
          OR public.can_manage_homework_scope(
            h.school_id, h.class_id, h.arm_id, h.subject_id, h.teacher_id, true
          )
        )
    )
  );

DROP POLICY IF EXISTS "School members submit homework" ON public.homework_submissions;
CREATE POLICY "School members submit homework"
  ON public.homework_submissions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.homework h
        ON h.id = homework_submissions.homework_id
       AND h.school_id = homework_submissions.school_id
      WHERE s.id = homework_submissions.student_id
        AND s.school_id = homework_submissions.school_id
        AND (
          public.is_school_admin_of(homework_submissions.school_id)
          OR (
            public.is_student_or_guardian_of(s.id, s.school_id)
            AND h.is_published
            AND public.homework_scope_is_valid(
              h.school_id, h.class_id, h.arm_id, h.subject_id
            )
            AND h.class_id = s.class_id
            AND (h.arm_id IS NULL OR h.arm_id = s.arm_id)
            AND homework_submissions.grade IS NULL
            AND homework_submissions.feedback IS NULL
            AND homework_submissions.graded_at IS NULL
            AND homework_submissions.graded_by IS NULL
          )
        )
    )
  );

DROP POLICY IF EXISTS "School members update submissions" ON public.homework_submissions;
CREATE POLICY "School members update submissions"
  ON public.homework_submissions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.homework h
        ON h.id = homework_submissions.homework_id
       AND h.school_id = homework_submissions.school_id
      WHERE s.id = homework_submissions.student_id
        AND s.school_id = homework_submissions.school_id
        AND (
          public.is_school_admin_of(homework_submissions.school_id)
          OR public.is_student_or_guardian_of(s.id, s.school_id)
          OR public.can_manage_homework_scope(
            h.school_id, h.class_id, h.arm_id, h.subject_id, h.teacher_id, true
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.homework h
        ON h.id = homework_submissions.homework_id
       AND h.school_id = homework_submissions.school_id
      WHERE s.id = homework_submissions.student_id
        AND s.school_id = homework_submissions.school_id
        AND (
          public.is_school_admin_of(homework_submissions.school_id)
          OR public.is_student_or_guardian_of(s.id, s.school_id)
          OR public.can_manage_homework_scope(
            h.school_id, h.class_id, h.arm_id, h.subject_id, h.teacher_id, true
          )
        )
    )
  );

-- RLS cannot compare OLD and NEW values. Keep student/guardian edits limited
-- to ungraded content, and teacher edits limited to grading fields.
CREATE OR REPLACE FUNCTION public.guard_homework_submission_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF public.is_school_admin_of(OLD.school_id) THEN
    RETURN NEW;
  END IF;

  IF public.can_manage_homework_record(OLD.homework_id, OLD.school_id, true) THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.school_id IS DISTINCT FROM OLD.school_id
       OR NEW.homework_id IS DISTINCT FROM OLD.homework_id
       OR NEW.student_id IS DISTINCT FROM OLD.student_id
       OR NEW.content IS DISTINCT FROM OLD.content
       OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at THEN
      RAISE EXCEPTION 'Teachers may only update grading fields';
    END IF;

    IF (
      NEW.grade IS DISTINCT FROM OLD.grade
      OR NEW.feedback IS DISTINCT FROM OLD.feedback
      OR NEW.graded_at IS DISTINCT FROM OLD.graded_at
      OR NEW.graded_by IS DISTINCT FROM OLD.graded_by
    ) AND NEW.graded_by IS DISTINCT FROM _uid THEN
      RAISE EXCEPTION 'The grading user must be the authenticated teacher';
    END IF;

    RETURN NEW;
  END IF;

  IF public.is_student_or_guardian_of(OLD.student_id, OLD.school_id) THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.school_id IS DISTINCT FROM OLD.school_id
       OR NEW.homework_id IS DISTINCT FROM OLD.homework_id
       OR NEW.student_id IS DISTINCT FROM OLD.student_id
       OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
       OR NEW.grade IS DISTINCT FROM OLD.grade
       OR NEW.feedback IS DISTINCT FROM OLD.feedback
       OR NEW.graded_at IS DISTINCT FROM OLD.graded_at
       OR NEW.graded_by IS DISTINCT FROM OLD.graded_by THEN
      RAISE EXCEPTION 'Students and guardians may only update submission content';
    END IF;

    IF (
      OLD.grade IS NOT NULL
      OR OLD.feedback IS NOT NULL
      OR OLD.graded_at IS NOT NULL
      OR OLD.graded_by IS NOT NULL
    ) AND NEW.content IS DISTINCT FROM OLD.content THEN
      RAISE EXCEPTION 'A graded submission cannot be changed by a student or guardian';
    END IF;

    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Not authorized';
END;
$$;

REVOKE ALL ON FUNCTION public.guard_homework_submission_update() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS homework_submissions_guard_update ON public.homework_submissions;
CREATE TRIGGER homework_submissions_guard_update
  BEFORE UPDATE ON public.homework_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_homework_submission_update();

-- Prevent teacher updates from moving homework outside the authorized scope.
CREATE OR REPLACE FUNCTION public.guard_homework_update_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF public.is_school_admin_of(OLD.school_id) THEN
    RETURN NEW;
  END IF;

  IF NOT public.can_manage_homework_record(OLD.id, OLD.school_id, true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.school_id IS DISTINCT FROM OLD.school_id
     OR NEW.class_id IS DISTINCT FROM OLD.class_id
     OR NEW.arm_id IS DISTINCT FROM OLD.arm_id
     OR NEW.subject_id IS DISTINCT FROM OLD.subject_id
     OR NEW.teacher_id IS DISTINCT FROM OLD.teacher_id THEN
    RAISE EXCEPTION 'Teachers cannot change homework assignment scope';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_homework_update_scope() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS homework_guard_update_scope ON public.homework;
CREATE TRIGGER homework_guard_update_scope
  BEFORE UPDATE ON public.homework
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_homework_update_scope();
