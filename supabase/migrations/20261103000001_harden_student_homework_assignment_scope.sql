-- Tighten the helper functions introduced by
-- 20261029000003_harden_student_privacy_homework.sql.
--
-- A direct homework.teacher_id match is not a substitute for a current,
-- school-scoped class/subject assignment. Subject-teacher access to student
-- records also validates that the assigned subject belongs to the same school.

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
            AND EXISTS (
              SELECT 1
              FROM public.subjects sub
              WHERE sub.id = sa.subject_id
                AND sub.school_id = s.school_id
            )
            AND sa.class_id = s.class_id
            AND (sa.class_arm_id IS NULL OR sa.class_arm_id IS NOT DISTINCT FROM s.arm_id)
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
    );
$$;


-- StudentWizard uploads the initial photo before the student row exists and
-- uses {school_id}/{student_code}/...; later document/photo uploads use
-- {school_id}/{student_uuid}/... . Preserve admin access for the pre-insert
-- upload, then resolve existing student-code paths through the school-scoped
-- unique key without granting school-wide member access.
DROP POLICY IF EXISTS "student assets read" ON storage.objects;
CREATE POLICY "student assets read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    CASE
      WHEN bucket_id <> 'student-assets' THEN false
      WHEN (storage.foldername(name))[1] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN false
      WHEN public.is_school_admin_of(((storage.foldername(name))[1])::uuid)
        THEN true
      WHEN (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN public.can_access_student_record(
          ((storage.foldername(name))[2])::uuid,
          ((storage.foldername(name))[1])::uuid
        )
      ELSE EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.school_id = ((storage.foldername(name))[1])::uuid
          AND s.student_code = (storage.foldername(name))[2]
          AND public.can_access_student_record(s.id, s.school_id)
      )
    END
  );
