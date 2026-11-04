-- Extend app_role enum with the specialist staff roles needed for RBAC.
-- PostgreSQL allows adding values to an existing enum but not removing them.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'bursar';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'account_officer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'receptionist';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'librarian';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'other_staff';
