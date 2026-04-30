-- Audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  before JSONB,
  after JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Block client writes audit log" ON public.admin_audit_log
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON public.admin_audit_log(table_name, created_at DESC);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_table_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_record_id UUID;
BEGIN
  -- Only log if executed by an admin (skip system/customer actions)
  IF v_admin_id IS NULL OR NOT public.has_role(v_admin_id, 'admin') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_record_id := COALESCE(NEW.id, OLD.id);

  INSERT INTO public.admin_audit_log (admin_id, action, table_name, record_id, before, after)
  VALUES (
    v_admin_id,
    TG_OP,
    TG_TABLE_NAME,
    v_record_id,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach to critical tables
DROP TRIGGER IF EXISTS audit_produtos ON public.produtos;
CREATE TRIGGER audit_produtos
AFTER INSERT OR UPDATE OR DELETE ON public.produtos
FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

DROP TRIGGER IF EXISTS audit_pedidos ON public.pedidos;
CREATE TRIGGER audit_pedidos
AFTER UPDATE OR DELETE ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

DROP TRIGGER IF EXISTS audit_cupons ON public.cupons;
CREATE TRIGGER audit_cupons
AFTER INSERT OR UPDATE OR DELETE ON public.cupons
FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();