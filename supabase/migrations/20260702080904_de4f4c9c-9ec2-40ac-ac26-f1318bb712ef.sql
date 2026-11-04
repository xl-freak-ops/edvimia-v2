DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT n.nspname, p.proname, oidvectortypes(p.proargtypes) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname IN ('has_role','is_super_admin','is_school_member','is_school_admin_of')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC', fn.nspname, fn.proname, fn.args);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM authenticated', fn.nspname, fn.proname, fn.args);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM anon', fn.nspname, fn.proname, fn.args);
  END LOOP;
END $$;
