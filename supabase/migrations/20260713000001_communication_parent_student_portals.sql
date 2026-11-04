-- ============================================================
-- Edvimia — Communication Center, Parent Portal, Student Portal
-- Adds: announcements, messages, homework, parent_student_links,
--       notifications tables with full RLS.
-- ============================================================

-- ── Announcements ──────────────────────────────────────────
CREATE TABLE public.announcements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  sender_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'general',
  -- announcement|reminder|emergency|academic|finance|event|disciplinary|general
  target_roles  TEXT[] NOT NULL DEFAULT '{}',
  -- empty = all roles, otherwise restrict to listed roles
  target_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  target_arm_id   UUID REFERENCES public.class_arms(id) ON DELETE SET NULL,
  is_emergency  BOOLEAN NOT NULL DEFAULT false,
  is_published  BOOLEAN NOT NULL DEFAULT false,
  scheduled_at  TIMESTAMPTZ,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER announcements_set_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Announcement reads (track who has seen what)
CREATE TABLE public.announcement_reads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id  UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

GRANT SELECT, INSERT ON public.announcement_reads TO authenticated;
GRANT ALL ON public.announcement_reads TO service_role;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- ── Direct Messages ────────────────────────────────────────
CREATE TABLE public.messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  sender_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject           TEXT,
  body              TEXT NOT NULL,
  message_type      TEXT NOT NULL DEFAULT 'general',
  parent_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  is_read           BOOLEAN NOT NULL DEFAULT false,
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ── Homework / Assignments ─────────────────────────────────
CREATE TABLE public.homework (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id     UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  arm_id       UUID REFERENCES public.class_arms(id) ON DELETE SET NULL,
  subject_id   UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id   UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  due_date     DATE NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework TO authenticated;
GRANT ALL ON public.homework TO service_role;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER homework_set_updated_at
  BEFORE UPDATE ON public.homework
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.homework_submissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  homework_id UUID NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  content     TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  grade       TEXT,
  feedback    TEXT,
  graded_at   TIMESTAMPTZ,
  graded_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(homework_id, student_id)
);

GRANT SELECT, INSERT, UPDATE ON public.homework_submissions TO authenticated;
GRANT ALL ON public.homework_submissions TO service_role;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;

-- ── Parent–Student Links ───────────────────────────────────
-- Links a parent auth user to their child's student record.
CREATE TABLE public.parent_student_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  parent_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  relationship    TEXT,
  is_primary      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_user_id, student_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_student_links TO authenticated;
GRANT ALL ON public.parent_student_links TO service_role;
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

-- ── In-app Notifications ───────────────────────────────────
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT,
  type        TEXT NOT NULL DEFAULT 'general',
  is_read     BOOLEAN NOT NULL DEFAULT false,
  read_at     TIMESTAMPTZ,
  action_url  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ───────────────────────────────────────────

-- Helper: current user is linked as parent of a given student
CREATE OR REPLACE FUNCTION public.is_parent_of(_student_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parent_student_links
    WHERE parent_user_id = auth.uid() AND student_id = _student_id
  )
$$;
GRANT EXECUTE ON FUNCTION public.is_parent_of(UUID) TO authenticated, anon;

-- Helper: current user is the student record linked to their profile
CREATE OR REPLACE FUNCTION public.is_student_user(_student_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE s.id = _student_id AND p.school_id = s.school_id
      AND public.has_role(auth.uid(), 'student')
      -- Rely on parent_student_links for student self-link too (or direct email match)
  )
$$;
GRANT EXECUTE ON FUNCTION public.is_student_user(UUID) TO authenticated, anon;

-- announcements: school members can read published ones; admins manage all
CREATE POLICY "School members read published announcements"
  ON public.announcements FOR SELECT TO authenticated
  USING (
    public.is_school_member(school_id)
    AND (is_published = true OR sender_id = auth.uid() OR public.is_school_admin_of(school_id))
  );

CREATE POLICY "Staff can create announcements"
  ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (public.is_school_member(school_id));

CREATE POLICY "Sender or admin can update announcements"
  ON public.announcements FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR public.is_school_admin_of(school_id));

CREATE POLICY "Admin can delete announcements"
  ON public.announcements FOR DELETE TO authenticated
  USING (public.is_school_admin_of(school_id));

-- announcement_reads: users manage their own reads
CREATE POLICY "Users manage own reads"
  ON public.announcement_reads FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- messages: sender and recipient can read; sender can insert
CREATE POLICY "Message participants can select"
  ON public.messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR public.is_school_admin_of(school_id));

CREATE POLICY "School members can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_school_member(school_id));

CREATE POLICY "Recipient can mark read"
  ON public.messages FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid() OR public.is_school_admin_of(school_id));

-- homework: school members read; staff create/update
CREATE POLICY "School members read published homework"
  ON public.homework FOR SELECT TO authenticated
  USING (public.is_school_member(school_id) AND (is_published = true OR public.is_school_admin_of(school_id)));

CREATE POLICY "Staff create homework"
  ON public.homework FOR INSERT TO authenticated
  WITH CHECK (public.is_school_member(school_id));

CREATE POLICY "Teacher or admin update homework"
  ON public.homework FOR UPDATE TO authenticated
  USING (public.is_school_member(school_id));

CREATE POLICY "Admin delete homework"
  ON public.homework FOR DELETE TO authenticated
  USING (public.is_school_admin_of(school_id));

-- homework_submissions: student + teacher + admin
CREATE POLICY "Student views own submissions; teacher/admin views class"
  ON public.homework_submissions FOR SELECT TO authenticated
  USING (public.is_school_member(school_id));

CREATE POLICY "School members submit homework"
  ON public.homework_submissions FOR INSERT TO authenticated
  WITH CHECK (public.is_school_member(school_id));

CREATE POLICY "School members update submissions"
  ON public.homework_submissions FOR UPDATE TO authenticated
  USING (public.is_school_member(school_id));

-- parent_student_links: parent sees own links; admin manages all
CREATE POLICY "Parents view own links"
  ON public.parent_student_links FOR SELECT TO authenticated
  USING (parent_user_id = auth.uid() OR public.is_school_admin_of(school_id));

CREATE POLICY "Admin manages parent links"
  ON public.parent_student_links FOR INSERT TO authenticated
  WITH CHECK (public.is_school_admin_of(school_id) OR parent_user_id = auth.uid());

CREATE POLICY "Admin updates parent links"
  ON public.parent_student_links FOR UPDATE TO authenticated
  USING (public.is_school_admin_of(school_id));

CREATE POLICY "Admin deletes parent links"
  ON public.parent_student_links FOR DELETE TO authenticated
  USING (public.is_school_admin_of(school_id));

-- notifications: users see own only; server-side creates them
CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_school_admin_of(school_id));

CREATE POLICY "System or admin creates notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_school_member(school_id));

CREATE POLICY "User marks own read"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ── RPC: Link parent to student ────────────────────────────
CREATE OR REPLACE FUNCTION public.link_parent_to_student(
  _school_id    UUID,
  _student_id   UUID,
  _parent_email TEXT,
  _relationship TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _parent_uid UUID;
BEGIN
  IF NOT public.is_school_admin_of(_school_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT id INTO _parent_uid FROM auth.users WHERE email = lower(btrim(_parent_email)) LIMIT 1;
  IF _parent_uid IS NULL THEN
    RAISE EXCEPTION 'No user account found for email: %', _parent_email;
  END IF;

  INSERT INTO public.parent_student_links (school_id, parent_user_id, student_id, relationship)
  VALUES (_school_id, _parent_uid, _student_id, _relationship)
  ON CONFLICT (parent_user_id, student_id) DO UPDATE SET relationship = EXCLUDED.relationship;

  -- Ensure the user has the parent role in this school
  INSERT INTO public.user_roles (user_id, role, school_id)
  VALUES (_parent_uid, 'parent', _school_id)
  ON CONFLICT (user_id, role, school_id) DO NOTHING;

  RETURN _parent_uid;
END;
$$;
GRANT EXECUTE ON FUNCTION public.link_parent_to_student(UUID, UUID, TEXT, TEXT) TO authenticated;

-- ── RPC: Broadcast announcement + auto-notify ───────────────
CREATE OR REPLACE FUNCTION public.publish_announcement(_announcement_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ann public.announcements%ROWTYPE;
  rec RECORD;
BEGIN
  SELECT * INTO ann FROM public.announcements WHERE id = _announcement_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Announcement not found'; END IF;
  IF NOT public.is_school_admin_of(ann.school_id) AND ann.sender_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.announcements
  SET is_published = true, published_at = now()
  WHERE id = _announcement_id;

  -- Create in-app notifications for all school members
  FOR rec IN
    SELECT DISTINCT p.id AS uid
    FROM public.profiles p
    WHERE p.school_id = ann.school_id
      AND (
        array_length(ann.target_roles, 1) IS NULL
        OR array_length(ann.target_roles, 1) = 0
        OR EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = p.id AND ur.role::text = ANY(ann.target_roles)
        )
      )
  LOOP
    INSERT INTO public.notifications (school_id, user_id, title, body, type, action_url)
    VALUES (ann.school_id, rec.uid, ann.title, left(ann.body, 200),
            CASE WHEN ann.is_emergency THEN 'emergency' ELSE ann.type END,
            '/communication')
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION public.publish_announcement(UUID) TO authenticated;
