-- Add email field to students table for student portal invites
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email TEXT;
