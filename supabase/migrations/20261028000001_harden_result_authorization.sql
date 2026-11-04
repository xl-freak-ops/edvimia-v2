-- Harden result access without changing the original result-module migration.
-- Teachers must have a school role, an active linked staff record, and an
-- assignment that matches the result's class, arm, subject, and session scope.

DROP POLICY IF EXISTS "members view sheets" ON public.result_sheets;
CREATE POLICY "members view sheets" ON public.result_sheets
  FOR SELECT TO authenticated
  USING (
    public.is_school_admin_of(school_id)
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.staff st
        ON st.user_id = ur.user_id
       AND st.school_id = ur.school_id
      JOIN public.staff_assignments sa
        ON sa.staff_id = st.id
       AND sa.school_id = st.school_id
      WHERE ur.user_id = auth.uid()
        AND ur.school_id = result_sheets.school_id
        AND ur.role IN ('form_teacher', 'subject_teacher')
        AND st.status = 'active'
        AND st.is_teaching
        AND (sa.session_id IS NULL OR sa.session_id = result_sheets.session_id)
        AND (
          (
            sa.assignment_type = 'subject'
            AND sa.subject_id = result_sheets.subject_id
            AND (sa.class_id IS NULL OR sa.class_id = result_sheets.class_id)
            AND (sa.class_arm_id IS NULL OR sa.class_arm_id = result_sheets.arm_id)
          )
          OR (
            sa.assignment_type = 'class'
            AND sa.class_id = result_sheets.class_id
            AND (sa.class_arm_id IS NULL OR sa.class_arm_id = result_sheets.arm_id)
          )
          OR (
            sa.assignment_type = 'class_arm'
            AND result_sheets.arm_id IS NOT NULL
            AND sa.class_arm_id = result_sheets.arm_id
          )
        )
    )
    OR (
      status = 'published'
      AND public.is_school_member(school_id)
      AND EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.school_id = result_sheets.school_id
          AND ur.role IN ('parent', 'student')
      )
      AND EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.school_id = result_sheets.school_id
          AND (
            (s.user_id = auth.uid()
              AND EXISTS (
                SELECT 1
                FROM public.user_roles ur
                WHERE ur.user_id = auth.uid()
                  AND ur.school_id = s.school_id
                  AND ur.role = 'student'
              ))
            OR (
              public.is_parent_of(s.id)
              AND EXISTS (
                SELECT 1
                FROM public.user_roles ur
                WHERE ur.user_id = auth.uid()
                  AND ur.school_id = s.school_id
                  AND ur.role = 'parent'
              )
            )
          )
          AND (
            (
              s.class_id = result_sheets.class_id
              AND s.arm_id IS NOT DISTINCT FROM result_sheets.arm_id
            )
            OR EXISTS (
              SELECT 1
              FROM public.result_meta rm
              WHERE rm.school_id = result_sheets.school_id
                AND rm.student_id = s.id
                AND rm.term_id IS NOT DISTINCT FROM result_sheets.term_id
                AND rm.class_id IS NOT DISTINCT FROM result_sheets.class_id
                AND rm.arm_id IS NOT DISTINCT FROM result_sheets.arm_id
                AND rm.is_published
            )
          )
      )
    )
  );

DROP POLICY IF EXISTS "teachers create sheets" ON public.result_sheets;
CREATE POLICY "teachers create sheets" ON public.result_sheets
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      public.is_school_admin_of(school_id)
    )
    OR (
      created_by = auth.uid()
      AND status = 'draft'
      AND EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.staff st
          ON st.user_id = ur.user_id
         AND st.school_id = ur.school_id
        JOIN public.staff_assignments sa
          ON sa.staff_id = st.id
         AND sa.school_id = st.school_id
        WHERE ur.user_id = auth.uid()
          AND ur.school_id = result_sheets.school_id
          AND ur.role IN ('form_teacher', 'subject_teacher')
          AND st.status = 'active'
          AND st.is_teaching
          AND (sa.session_id IS NULL OR sa.session_id = result_sheets.session_id)
          AND (
            (
              sa.assignment_type = 'subject'
              AND sa.subject_id = result_sheets.subject_id
              AND (sa.class_id IS NULL OR sa.class_id = result_sheets.class_id)
              AND (sa.class_arm_id IS NULL OR sa.class_arm_id = result_sheets.arm_id)
            )
            OR (
              sa.assignment_type = 'class'
              AND sa.class_id = result_sheets.class_id
              AND (sa.class_arm_id IS NULL OR sa.class_arm_id = result_sheets.arm_id)
            )
            OR (
              sa.assignment_type = 'class_arm'
              AND result_sheets.arm_id IS NOT NULL
              AND sa.class_arm_id = result_sheets.arm_id
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "teachers update own sheets" ON public.result_sheets;
CREATE POLICY "teachers update own sheets" ON public.result_sheets
  FOR UPDATE TO authenticated
  USING (
    public.is_school_admin_of(school_id)
    OR (
      status = 'draft'
      AND (created_by = auth.uid() OR submitted_by = auth.uid())
      AND EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.staff st
          ON st.user_id = ur.user_id
         AND st.school_id = ur.school_id
        JOIN public.staff_assignments sa
          ON sa.staff_id = st.id
         AND sa.school_id = st.school_id
        WHERE ur.user_id = auth.uid()
          AND ur.school_id = result_sheets.school_id
          AND ur.role IN ('form_teacher', 'subject_teacher')
          AND st.status = 'active'
          AND st.is_teaching
          AND (sa.session_id IS NULL OR sa.session_id = result_sheets.session_id)
          AND (
            (
              sa.assignment_type = 'subject'
              AND sa.subject_id = result_sheets.subject_id
              AND (sa.class_id IS NULL OR sa.class_id = result_sheets.class_id)
              AND (sa.class_arm_id IS NULL OR sa.class_arm_id = result_sheets.arm_id)
            )
            OR (
              sa.assignment_type = 'class'
              AND sa.class_id = result_sheets.class_id
              AND (sa.class_arm_id IS NULL OR sa.class_arm_id = result_sheets.arm_id)
            )
            OR (
              sa.assignment_type = 'class_arm'
              AND result_sheets.arm_id IS NOT NULL
              AND sa.class_arm_id = result_sheets.arm_id
            )
          )
        )
    )
  )
  WITH CHECK (
    public.is_school_admin_of(school_id)
    OR (
      status IN ('draft', 'pending_review')
      AND (created_by = auth.uid() OR submitted_by = auth.uid())
      AND EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.staff st
          ON st.user_id = ur.user_id
         AND st.school_id = ur.school_id
        JOIN public.staff_assignments sa
          ON sa.staff_id = st.id
         AND sa.school_id = st.school_id
        WHERE ur.user_id = auth.uid()
          AND ur.school_id = result_sheets.school_id
          AND ur.role IN ('form_teacher', 'subject_teacher')
          AND st.status = 'active'
          AND st.is_teaching
          AND (sa.session_id IS NULL OR sa.session_id = result_sheets.session_id)
          AND (
            (
              sa.assignment_type = 'subject'
              AND sa.subject_id = result_sheets.subject_id
              AND (sa.class_id IS NULL OR sa.class_id = result_sheets.class_id)
              AND (sa.class_arm_id IS NULL OR sa.class_arm_id = result_sheets.arm_id)
            )
            OR (
              sa.assignment_type = 'class'
              AND sa.class_id = result_sheets.class_id
              AND (sa.class_arm_id IS NULL OR sa.class_arm_id = result_sheets.arm_id)
            )
            OR (
              sa.assignment_type = 'class_arm'
              AND result_sheets.arm_id IS NOT NULL
              AND sa.class_arm_id = result_sheets.arm_id
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "teachers reopen rejected sheets" ON public.result_sheets;
CREATE POLICY "teachers reopen rejected sheets" ON public.result_sheets
  FOR UPDATE TO authenticated
  USING (
    status = 'rejected'
    AND (created_by = auth.uid() OR submitted_by = auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.staff st
        ON st.user_id = ur.user_id
       AND st.school_id = ur.school_id
      JOIN public.staff_assignments sa
        ON sa.staff_id = st.id
       AND sa.school_id = st.school_id
      WHERE ur.user_id = auth.uid()
        AND ur.school_id = result_sheets.school_id
        AND ur.role IN ('form_teacher', 'subject_teacher')
        AND st.status = 'active'
        AND st.is_teaching
        AND (sa.session_id IS NULL OR sa.session_id = result_sheets.session_id)
        AND (
          (
            sa.assignment_type = 'subject'
            AND sa.subject_id = result_sheets.subject_id
            AND (sa.class_id IS NULL OR sa.class_id = result_sheets.class_id)
            AND (sa.class_arm_id IS NULL OR sa.class_arm_id = result_sheets.arm_id)
          )
          OR (
            sa.assignment_type = 'class'
            AND sa.class_id = result_sheets.class_id
            AND (sa.class_arm_id IS NULL OR sa.class_arm_id = result_sheets.arm_id)
          )
          OR (
            sa.assignment_type = 'class_arm'
            AND result_sheets.arm_id IS NOT NULL
            AND sa.class_arm_id = result_sheets.arm_id
          )
        )
    )
  )
  WITH CHECK (
    status = 'draft'
    AND (created_by = auth.uid() OR submitted_by = auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.staff st
        ON st.user_id = ur.user_id
       AND st.school_id = ur.school_id
      JOIN public.staff_assignments sa
        ON sa.staff_id = st.id
       AND sa.school_id = st.school_id
      WHERE ur.user_id = auth.uid()
        AND ur.school_id = result_sheets.school_id
        AND ur.role IN ('form_teacher', 'subject_teacher')
        AND st.status = 'active'
        AND st.is_teaching
        AND (sa.session_id IS NULL OR sa.session_id = result_sheets.session_id)
        AND (
          (
            sa.assignment_type = 'subject'
            AND sa.subject_id = result_sheets.subject_id
            AND (sa.class_id IS NULL OR sa.class_id = result_sheets.class_id)
            AND (sa.class_arm_id IS NULL OR sa.class_arm_id = result_sheets.arm_id)
          )
          OR (
            sa.assignment_type = 'class'
            AND sa.class_id = result_sheets.class_id
            AND (sa.class_arm_id IS NULL OR sa.class_arm_id = result_sheets.arm_id)
          )
          OR (
            sa.assignment_type = 'class_arm'
            AND result_sheets.arm_id IS NOT NULL
            AND sa.class_arm_id = result_sheets.arm_id
          )
        )
    )
  );

DROP POLICY IF EXISTS "members view scores" ON public.result_scores;
CREATE POLICY "members view scores" ON public.result_scores
  FOR SELECT TO authenticated
  USING (
    public.is_school_admin_of(school_id)
    OR (
      EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.school_id = result_scores.school_id
          AND ur.role IN ('form_teacher', 'subject_teacher')
      )
      AND EXISTS (
        SELECT 1
        FROM public.result_sheets rs
        WHERE rs.id = result_scores.sheet_id
          AND rs.school_id = result_scores.school_id
          AND rs.session_id IS NOT DISTINCT FROM result_scores.session_id
          AND rs.term_id IS NOT DISTINCT FROM result_scores.term_id
          AND rs.class_id IS NOT DISTINCT FROM result_scores.class_id
          AND rs.arm_id IS NOT DISTINCT FROM result_scores.arm_id
          AND rs.subject_id = result_scores.subject_id
      )
    )
    OR (
      EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = result_scores.student_id
          AND s.school_id = result_scores.school_id
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
            OR (
              public.is_parent_of(s.id)
              AND EXISTS (
                SELECT 1
                FROM public.user_roles ur
                WHERE ur.user_id = auth.uid()
                  AND ur.school_id = s.school_id
                  AND ur.role = 'parent'
              )
            )
          )
      )
      AND EXISTS (
        SELECT 1
        FROM public.result_sheets rs
        WHERE rs.id = result_scores.sheet_id
          AND rs.school_id = result_scores.school_id
          AND rs.status = 'published'
      )
    )
  );

DROP POLICY IF EXISTS "members write scores" ON public.result_scores;
CREATE POLICY "members write scores" ON public.result_scores
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      public.is_school_admin_of(school_id)
      AND EXISTS (
        SELECT 1
        FROM public.result_sheets rs
        JOIN public.students s
          ON s.id = result_scores.student_id
         AND s.school_id = rs.school_id
        JOIN public.subjects sub
          ON sub.id = result_scores.subject_id
         AND sub.school_id = rs.school_id
        JOIN public.assessment_components ac
          ON ac.id = result_scores.component_id
         AND ac.school_id = rs.school_id
        WHERE rs.id = result_scores.sheet_id
          AND rs.school_id = result_scores.school_id
          AND rs.session_id IS NOT DISTINCT FROM result_scores.session_id
          AND rs.term_id IS NOT DISTINCT FROM result_scores.term_id
          AND rs.class_id IS NOT DISTINCT FROM result_scores.class_id
          AND rs.arm_id IS NOT DISTINCT FROM result_scores.arm_id
          AND rs.subject_id = result_scores.subject_id
      )
    )
    OR (
      entered_by = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.school_id = result_scores.school_id
          AND ur.role IN ('form_teacher', 'subject_teacher')
      )
      AND EXISTS (
        SELECT 1
        FROM public.result_sheets rs
        JOIN public.students s
          ON s.id = result_scores.student_id
         AND s.school_id = rs.school_id
        JOIN public.subjects sub
          ON sub.id = result_scores.subject_id
         AND sub.school_id = rs.school_id
        JOIN public.assessment_components ac
          ON ac.id = result_scores.component_id
         AND ac.school_id = rs.school_id
        WHERE rs.id = result_scores.sheet_id
          AND rs.school_id = result_scores.school_id
          AND rs.status IN ('draft', 'pending_review', 'rejected')
          AND rs.session_id IS NOT DISTINCT FROM result_scores.session_id
          AND rs.term_id IS NOT DISTINCT FROM result_scores.term_id
          AND rs.class_id IS NOT DISTINCT FROM result_scores.class_id
          AND rs.arm_id IS NOT DISTINCT FROM result_scores.arm_id
          AND rs.subject_id = result_scores.subject_id
          AND s.class_id = rs.class_id
          AND s.arm_id IS NOT DISTINCT FROM rs.arm_id
      )
    )
  );

DROP POLICY IF EXISTS "members update scores" ON public.result_scores;
CREATE POLICY "members update scores" ON public.result_scores
  FOR UPDATE TO authenticated
  USING (
    (
      public.is_school_admin_of(school_id)
      AND EXISTS (
        SELECT 1
        FROM public.result_sheets rs
        JOIN public.students s
          ON s.id = result_scores.student_id
         AND s.school_id = rs.school_id
        JOIN public.subjects sub
          ON sub.id = result_scores.subject_id
         AND sub.school_id = rs.school_id
        JOIN public.assessment_components ac
          ON ac.id = result_scores.component_id
         AND ac.school_id = rs.school_id
        WHERE rs.id = result_scores.sheet_id
          AND rs.school_id = result_scores.school_id
          AND rs.session_id IS NOT DISTINCT FROM result_scores.session_id
          AND rs.term_id IS NOT DISTINCT FROM result_scores.term_id
          AND rs.class_id IS NOT DISTINCT FROM result_scores.class_id
          AND rs.arm_id IS NOT DISTINCT FROM result_scores.arm_id
          AND rs.subject_id = result_scores.subject_id
      )
    )
    OR (
      EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.school_id = result_scores.school_id
          AND ur.role IN ('form_teacher', 'subject_teacher')
      )
      AND EXISTS (
        SELECT 1
        FROM public.result_sheets rs
        WHERE rs.id = result_scores.sheet_id
          AND rs.school_id = result_scores.school_id
          AND rs.status IN ('draft', 'pending_review', 'rejected')
      )
    )
  )
  WITH CHECK (
    (
      public.is_school_admin_of(school_id)
      AND EXISTS (
        SELECT 1
        FROM public.result_sheets rs
        JOIN public.students s
          ON s.id = result_scores.student_id
         AND s.school_id = rs.school_id
        JOIN public.subjects sub
          ON sub.id = result_scores.subject_id
         AND sub.school_id = rs.school_id
        JOIN public.assessment_components ac
          ON ac.id = result_scores.component_id
         AND ac.school_id = rs.school_id
        WHERE rs.id = result_scores.sheet_id
          AND rs.school_id = result_scores.school_id
          AND rs.session_id IS NOT DISTINCT FROM result_scores.session_id
          AND rs.term_id IS NOT DISTINCT FROM result_scores.term_id
          AND rs.class_id IS NOT DISTINCT FROM result_scores.class_id
          AND rs.arm_id IS NOT DISTINCT FROM result_scores.arm_id
          AND rs.subject_id = result_scores.subject_id
      )
    )
    OR (
      entered_by = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.school_id = result_scores.school_id
          AND ur.role IN ('form_teacher', 'subject_teacher')
      )
      AND EXISTS (
        SELECT 1
        FROM public.result_sheets rs
        JOIN public.students s
          ON s.id = result_scores.student_id
         AND s.school_id = rs.school_id
        JOIN public.subjects sub
          ON sub.id = result_scores.subject_id
         AND sub.school_id = rs.school_id
        JOIN public.assessment_components ac
          ON ac.id = result_scores.component_id
         AND ac.school_id = rs.school_id
        WHERE rs.id = result_scores.sheet_id
          AND rs.school_id = result_scores.school_id
          AND rs.status IN ('draft', 'pending_review', 'rejected')
          AND rs.session_id IS NOT DISTINCT FROM result_scores.session_id
          AND rs.term_id IS NOT DISTINCT FROM result_scores.term_id
          AND rs.class_id IS NOT DISTINCT FROM result_scores.class_id
          AND rs.arm_id IS NOT DISTINCT FROM result_scores.arm_id
          AND rs.subject_id = result_scores.subject_id
          AND s.class_id = rs.class_id
          AND s.arm_id IS NOT DISTINCT FROM rs.arm_id
      )
    )
  );

DROP POLICY IF EXISTS "members delete scores" ON public.result_scores;
CREATE POLICY "members delete scores" ON public.result_scores
  FOR DELETE TO authenticated
  USING (
    (
      public.is_school_admin_of(school_id)
      AND EXISTS (
        SELECT 1
        FROM public.result_sheets rs
        JOIN public.students s
          ON s.id = result_scores.student_id
         AND s.school_id = rs.school_id
        JOIN public.subjects sub
          ON sub.id = result_scores.subject_id
         AND sub.school_id = rs.school_id
        JOIN public.assessment_components ac
          ON ac.id = result_scores.component_id
         AND ac.school_id = rs.school_id
        WHERE rs.id = result_scores.sheet_id
          AND rs.school_id = result_scores.school_id
      )
    )
    OR (
      EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.school_id = result_scores.school_id
          AND ur.role IN ('form_teacher', 'subject_teacher')
      )
      AND EXISTS (
        SELECT 1
        FROM public.result_sheets rs
        JOIN public.students s
          ON s.id = result_scores.student_id
         AND s.school_id = rs.school_id
        WHERE rs.id = result_scores.sheet_id
          AND rs.school_id = result_scores.school_id
          AND rs.status IN ('draft', 'pending_review', 'rejected')
          AND rs.session_id IS NOT DISTINCT FROM result_scores.session_id
          AND rs.term_id IS NOT DISTINCT FROM result_scores.term_id
          AND rs.class_id IS NOT DISTINCT FROM result_scores.class_id
          AND rs.arm_id IS NOT DISTINCT FROM result_scores.arm_id
          AND rs.subject_id = result_scores.subject_id
          AND s.class_id = rs.class_id
          AND s.arm_id IS NOT DISTINCT FROM rs.arm_id
      )
    )
  );

DROP POLICY IF EXISTS "members view meta" ON public.result_meta;
CREATE POLICY "members view meta" ON public.result_meta
  FOR SELECT TO authenticated
  USING (
    public.is_school_admin_of(school_id)
    OR (
      is_published
      AND EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = result_meta.student_id
          AND s.school_id = result_meta.school_id
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
            OR (
              public.is_parent_of(s.id)
              AND EXISTS (
                SELECT 1
                FROM public.user_roles ur
                WHERE ur.user_id = auth.uid()
                  AND ur.school_id = s.school_id
                  AND ur.role = 'parent'
              )
            )
          )
      )
    )
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.staff st
        ON st.user_id = ur.user_id
       AND st.school_id = ur.school_id
      JOIN public.staff_assignments sa
        ON sa.staff_id = st.id
       AND sa.school_id = st.school_id
      WHERE ur.user_id = auth.uid()
        AND ur.school_id = result_meta.school_id
        AND ur.role IN ('form_teacher', 'subject_teacher')
        AND st.status = 'active'
        AND st.is_teaching
        AND (sa.session_id IS NULL OR sa.session_id = result_meta.session_id)
        AND (
          (sa.assignment_type = 'class' AND sa.class_id = result_meta.class_id)
          OR (
            sa.assignment_type = 'class_arm'
            AND result_meta.arm_id IS NOT NULL
            AND sa.class_arm_id = result_meta.arm_id
          )
        )
    )
  );

DROP POLICY IF EXISTS "members view audit" ON public.result_audit;
CREATE POLICY "members view audit" ON public.result_audit
  FOR SELECT TO authenticated
  USING (
    public.is_school_admin_of(school_id)
    OR (
      EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.school_id = result_audit.school_id
          AND ur.role IN ('form_teacher', 'subject_teacher')
      )
      AND EXISTS (
        SELECT 1
        FROM public.result_sheets rs
        WHERE rs.id = result_audit.sheet_id
          AND rs.school_id = result_audit.school_id
      )
    )
  );

DROP POLICY IF EXISTS "members insert audit" ON public.result_audit;
CREATE POLICY "members insert audit" ON public.result_audit
  FOR INSERT TO authenticated
  WITH CHECK (
    actor = auth.uid()
    AND (
      public.is_school_admin_of(school_id)
      OR (
        sheet_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
            AND ur.school_id = result_audit.school_id
            AND ur.role IN ('form_teacher', 'subject_teacher')
        )
        AND EXISTS (
          SELECT 1
          FROM public.result_sheets rs
          WHERE rs.id = result_audit.sheet_id
            AND rs.school_id = result_audit.school_id
        )
        AND (
          student_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.students s
            JOIN public.result_sheets rs
              ON rs.id = result_audit.sheet_id
             AND rs.school_id = result_audit.school_id
            WHERE s.id = result_audit.student_id
              AND s.school_id = result_audit.school_id
              AND s.class_id = rs.class_id
              AND s.arm_id IS NOT DISTINCT FROM rs.arm_id
          )
        )
      )
    )
  );
