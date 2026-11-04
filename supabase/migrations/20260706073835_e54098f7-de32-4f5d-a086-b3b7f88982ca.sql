
-- ============ Enums ============
DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('cash','bank_transfer','pos','card','online','cheque','scholarship','waiver','discount');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('draft','issued','partial','paid','overdue','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.expense_status AS ENUM ('draft','pending_approval','approved','rejected','paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Finance managers: admins, principals, vice principals
CREATE OR REPLACE FUNCTION public.can_manage_finance(_school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND (school_id = _school_id OR school_id IS NULL)
        AND role IN ('school_admin','principal','vice_principal')
    );
$$;

-- ============ fee_categories ============
CREATE TABLE public.fee_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_categories TO authenticated;
GRANT ALL ON public.fee_categories TO service_role;
ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_fee_categories" ON public.fee_categories FOR SELECT USING (public.is_school_member(school_id));
CREATE POLICY "write_fee_categories" ON public.fee_categories FOR ALL
  USING (public.can_manage_finance(school_id))
  WITH CHECK (public.can_manage_finance(school_id));
CREATE TRIGGER trg_fee_categories_updated BEFORE UPDATE ON public.fee_categories
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ fee_structures ============
CREATE TABLE public.fee_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.fee_categories(id) ON DELETE RESTRICT,
  session_id uuid REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  arm_id uuid REFERENCES public.class_arms(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  mandatory boolean NOT NULL DEFAULT true,
  due_date date,
  penalty_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (penalty_amount >= 0),
  discount_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_structures TO authenticated;
GRANT ALL ON public.fee_structures TO service_role;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_fee_structures" ON public.fee_structures FOR SELECT USING (public.is_school_member(school_id));
CREATE POLICY "write_fee_structures" ON public.fee_structures FOR ALL
  USING (public.can_manage_finance(school_id))
  WITH CHECK (public.can_manage_finance(school_id));
CREATE TRIGGER trg_fee_structures_updated BEFORE UPDATE ON public.fee_structures
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_fee_structures_school_class ON public.fee_structures(school_id, class_id, term_id);

-- ============ invoices ============
CREATE SEQUENCE IF NOT EXISTS public.invoice_seq;
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  arm_id uuid REFERENCES public.class_arms(id) ON DELETE SET NULL,
  status public.invoice_status NOT NULL DEFAULT 'issued',
  issue_date date NOT NULL DEFAULT current_date,
  due_date date,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount_total numeric(12,2) NOT NULL DEFAULT 0,
  penalty_total numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  amount_paid numeric(12,2) NOT NULL DEFAULT 0,
  balance numeric(12,2) GENERATED ALWAYS AS (total - amount_paid) STORED,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_invoices" ON public.invoices FOR SELECT USING (public.is_school_member(school_id));
CREATE POLICY "write_invoices" ON public.invoices FOR ALL
  USING (public.can_manage_finance(school_id))
  WITH CHECK (public.can_manage_finance(school_id));
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_invoices_school_student ON public.invoices(school_id, student_id);
CREATE INDEX idx_invoices_status ON public.invoices(school_id, status);

CREATE OR REPLACE FUNCTION public.tg_invoice_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || to_char(now(), 'YYYYMM') || '-' ||
      lpad(nextval('public.invoice_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_invoices_number BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.tg_invoice_number();

-- ============ invoice_items ============
CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  fee_structure_id uuid REFERENCES public.fee_structures(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.fee_categories(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  penalty numeric(12,2) NOT NULL DEFAULT 0,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_items TO service_role;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_invoice_items" ON public.invoice_items FOR SELECT USING (public.is_school_member(school_id));
CREATE POLICY "write_invoice_items" ON public.invoice_items FOR ALL
  USING (public.can_manage_finance(school_id))
  WITH CHECK (public.can_manage_finance(school_id));
CREATE INDEX idx_invoice_items_invoice ON public.invoice_items(invoice_id);

-- ============ payments ============
CREATE SEQUENCE IF NOT EXISTS public.payment_seq;
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  payment_code text NOT NULL UNIQUE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  method public.payment_method NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  reference text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  cashier_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_payments" ON public.payments FOR SELECT USING (public.is_school_member(school_id));
CREATE POLICY "write_payments" ON public.payments FOR ALL
  USING (public.can_manage_finance(school_id))
  WITH CHECK (public.can_manage_finance(school_id));
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_payments_school_paid ON public.payments(school_id, paid_at DESC);
CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);

CREATE OR REPLACE FUNCTION public.tg_payment_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.payment_code IS NULL OR NEW.payment_code = '' THEN
    NEW.payment_code := 'PAY-' || to_char(now(), 'YYYYMM') || '-' ||
      lpad(nextval('public.payment_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_payments_code BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_payment_code();

CREATE OR REPLACE FUNCTION public.tg_recalc_invoice()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _inv uuid; _paid numeric; _total numeric;
BEGIN
  _inv := COALESCE(NEW.invoice_id, OLD.invoice_id);
  IF _inv IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  SELECT COALESCE(SUM(amount),0) INTO _paid FROM public.payments WHERE invoice_id = _inv;
  SELECT total INTO _total FROM public.invoices WHERE id = _inv;
  UPDATE public.invoices SET
    amount_paid = _paid,
    status = CASE
      WHEN _paid >= _total AND _total > 0 THEN 'paid'::public.invoice_status
      WHEN _paid > 0 THEN 'partial'::public.invoice_status
      ELSE status
    END
  WHERE id = _inv;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER trg_payments_recalc AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_recalc_invoice();

-- ============ receipts (immutable) ============
CREATE SEQUENCE IF NOT EXISTS public.receipt_seq;
CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  receipt_number text NOT NULL UNIQUE,
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  balance_after numeric(12,2) NOT NULL DEFAULT 0,
  verification_token text NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex'),
  issued_at timestamptz NOT NULL DEFAULT now(),
  issued_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (payment_id)
);
GRANT SELECT, INSERT ON public.receipts TO authenticated;
GRANT ALL ON public.receipts TO service_role;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_receipts" ON public.receipts FOR SELECT USING (public.is_school_member(school_id));
CREATE POLICY "insert_receipts" ON public.receipts FOR INSERT
  WITH CHECK (public.can_manage_finance(school_id));

CREATE OR REPLACE FUNCTION public.tg_receipt_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    NEW.receipt_number := 'RCT-' || to_char(now(), 'YYYYMM') || '-' ||
      lpad(nextval('public.receipt_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_receipts_number BEFORE INSERT ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.tg_receipt_number();

CREATE OR REPLACE FUNCTION public.tg_auto_receipt()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _bal numeric := 0;
BEGIN
  IF NEW.invoice_id IS NOT NULL THEN
    SELECT balance INTO _bal FROM public.invoices WHERE id = NEW.invoice_id;
  END IF;
  INSERT INTO public.receipts (school_id, payment_id, student_id, invoice_id, amount, balance_after, issued_by)
  VALUES (NEW.school_id, NEW.id, NEW.student_id, NEW.invoice_id, NEW.amount, COALESCE(_bal,0), NEW.cashier_id)
  ON CONFLICT (payment_id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_payments_receipt AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_auto_receipt();

-- ============ expense_categories ============
CREATE TABLE public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_categories TO authenticated;
GRANT ALL ON public.expense_categories TO service_role;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_expense_categories" ON public.expense_categories FOR SELECT USING (public.is_school_member(school_id));
CREATE POLICY "write_expense_categories" ON public.expense_categories FOR ALL
  USING (public.can_manage_finance(school_id))
  WITH CHECK (public.can_manage_finance(school_id));
CREATE TRIGGER trg_expense_cats_updated BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ expenses ============
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  vendor text,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  expense_date date NOT NULL DEFAULT current_date,
  status public.expense_status NOT NULL DEFAULT 'draft',
  receipt_url text,
  recurring boolean NOT NULL DEFAULT false,
  recurrence_note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_expenses" ON public.expenses FOR SELECT USING (public.is_school_member(school_id));
CREATE POLICY "write_expenses" ON public.expenses FOR ALL
  USING (public.can_manage_finance(school_id))
  WITH CHECK (public.can_manage_finance(school_id));
CREATE TRIGGER trg_expenses_updated BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_expenses_school_date ON public.expenses(school_id, expense_date DESC);

-- ============ finance_audit (append-only) ============
CREATE TABLE public.finance_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  actor uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.finance_audit TO authenticated;
GRANT ALL ON public.finance_audit TO service_role;
ALTER TABLE public.finance_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_finance_audit" ON public.finance_audit FOR SELECT USING (public.is_school_member(school_id));
CREATE POLICY "insert_finance_audit" ON public.finance_audit FOR INSERT
  WITH CHECK (public.can_manage_finance(school_id));

-- ============ Bulk invoice generation ============
CREATE OR REPLACE FUNCTION public.generate_invoices_for_class(
  _school_id uuid,
  _term_id uuid,
  _class_id uuid,
  _arm_id uuid DEFAULT NULL
) RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _count int := 0;
  _stu record;
  _new_inv uuid;
  _sub numeric;
  _disc numeric;
  _pen numeric;
  _due date;
BEGIN
  IF NOT public.can_manage_finance(_school_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT COALESCE(SUM(amount),0), COALESCE(SUM(discount_amount),0),
         COALESCE(SUM(penalty_amount),0), MIN(due_date)
    INTO _sub, _disc, _pen, _due
    FROM public.fee_structures
    WHERE school_id = _school_id
      AND is_active = true
      AND (term_id = _term_id OR term_id IS NULL)
      AND (class_id = _class_id OR class_id IS NULL)
      AND (_arm_id IS NULL OR arm_id = _arm_id OR arm_id IS NULL);

  FOR _stu IN
    SELECT s.id FROM public.students s
    WHERE s.school_id = _school_id
      AND s.status = 'active'
      AND s.current_class_id = _class_id
      AND (_arm_id IS NULL OR s.current_arm_id = _arm_id)
  LOOP
    IF EXISTS (SELECT 1 FROM public.invoices
               WHERE student_id = _stu.id AND term_id = _term_id) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.invoices (school_id, student_id, session_id, term_id, class_id, arm_id,
                                 status, subtotal, discount_total, penalty_total, total, due_date, created_by)
    SELECT _school_id, _stu.id, t.session_id, _term_id, _class_id, _arm_id,
           'issued', _sub, _disc, _pen, (_sub - _disc + _pen), _due, auth.uid()
    FROM public.terms t WHERE t.id = _term_id
    RETURNING id INTO _new_inv;

    INSERT INTO public.invoice_items (invoice_id, school_id, fee_structure_id, category_id,
                                      description, amount, discount, penalty)
    SELECT _new_inv, _school_id, fs.id, fs.category_id, fc.name, fs.amount,
           fs.discount_amount, fs.penalty_amount
      FROM public.fee_structures fs
      JOIN public.fee_categories fc ON fc.id = fs.category_id
     WHERE fs.school_id = _school_id
       AND fs.is_active = true
       AND (fs.term_id = _term_id OR fs.term_id IS NULL)
       AND (fs.class_id = _class_id OR fs.class_id IS NULL)
       AND (_arm_id IS NULL OR fs.arm_id = _arm_id OR fs.arm_id IS NULL);

    _count := _count + 1;
  END LOOP;

  RETURN _count;
END $$;
