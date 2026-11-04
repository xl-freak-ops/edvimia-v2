
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP POLICY IF EXISTS "Authenticated can create school" ON public.schools;
CREATE POLICY "Authenticated can create school" ON public.schools FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
