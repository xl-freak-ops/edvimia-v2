-- Keep announcement creation and editing limited to the staff roles exposed
-- by the Communication Center. Staff may still create drafts and publish.
DROP POLICY IF EXISTS "Staff can create announcements" ON public.announcements;
CREATE POLICY "Staff can create announcements"
  ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_school_member(school_id)
    AND (
      public.is_school_admin_of(school_id)
      OR EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND school_id = announcements.school_id
          AND role IN ('form_teacher', 'subject_teacher')
      )
    )
  );

DROP POLICY IF EXISTS "Sender or admin can update announcements" ON public.announcements;
CREATE POLICY "Sender or admin can update announcements"
  ON public.announcements FOR UPDATE TO authenticated
  USING (
    public.is_school_admin_of(school_id)
    OR (
      sender_id = auth.uid()
      AND public.is_school_member(school_id)
      AND EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND school_id = announcements.school_id
          AND role IN ('form_teacher', 'subject_teacher')
      )
    )
  )
  WITH CHECK (
    public.is_school_admin_of(school_id)
    OR (
      sender_id = auth.uid()
      AND public.is_school_member(school_id)
      AND EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND school_id = announcements.school_id
          AND role IN ('form_teacher', 'subject_teacher')
      )
    )
  );

CREATE OR REPLACE FUNCTION public.publish_announcement(_announcement_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  ann public.announcements%ROWTYPE;
  rec RECORD;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO ann
  FROM public.announcements
  WHERE id = _announcement_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Announcement not found';
  END IF;

  IF NOT public.is_school_member(ann.school_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT public.is_school_admin_of(ann.school_id)
     AND (
       ann.sender_id IS DISTINCT FROM _uid
       OR NOT EXISTS (
         SELECT 1
         FROM public.user_roles
         WHERE user_id = _uid
           AND school_id = ann.school_id
           AND role IN ('form_teacher', 'subject_teacher')
       )
     ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.announcements
  SET is_published = true, published_at = now()
  WHERE id = _announcement_id;

  -- Notify the announcement's school recipients after authorized publishing.
  FOR rec IN
    SELECT DISTINCT p.id AS uid
    FROM public.profiles p
    WHERE p.school_id = ann.school_id
      AND (
        array_length(ann.target_roles, 1) IS NULL
        OR array_length(ann.target_roles, 1) = 0
        OR EXISTS (
          SELECT 1
          FROM public.user_roles ur
          WHERE ur.user_id = p.id
            AND ur.role::text = ANY(ann.target_roles)
        )
      )
  LOOP
    INSERT INTO public.notifications (school_id, user_id, title, body, type, action_url)
    VALUES (
      ann.school_id,
      rec.uid,
      ann.title,
      left(ann.body, 200),
      CASE WHEN ann.is_emergency THEN 'emergency' ELSE ann.type END,
      '/communication'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_announcement(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_announcement(UUID) TO authenticated;
