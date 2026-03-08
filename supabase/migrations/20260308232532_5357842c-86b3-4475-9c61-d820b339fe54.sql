
-- 1. Order status history table
CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  status_anterior text,
  status_novo text NOT NULL,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage status history" ON public.order_status_history FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own order status history" ON public.order_status_history FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.pedidos WHERE pedidos.id = order_status_history.pedido_id AND pedidos.user_id = auth.uid())
);

-- Trigger to auto-log status changes on pedidos
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (pedido_id, status_anterior, status_novo)
    VALUES (NEW.id, OLD.status::text, NEW.status::text);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_order_status
  AFTER UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_status_change();

-- 2. Collections table for editorial curation
CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  descricao text,
  imagem_url text,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage collections" ON public.collections FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active collections" ON public.collections FOR SELECT TO anon, authenticated USING (ativo = true);

-- Collection-product junction
CREATE TABLE public.collection_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 0,
  UNIQUE(collection_id, produto_id)
);

ALTER TABLE public.collection_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage collection products" ON public.collection_produtos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view collection products" ON public.collection_produtos FOR SELECT TO anon, authenticated USING (true);

-- 3. Add sku and intensidade to produtos
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS intensidade integer;

-- 4. Add order_number sequential to pedidos
CREATE SEQUENCE IF NOT EXISTS public.pedido_number_seq START 1001;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS order_number integer UNIQUE DEFAULT nextval('public.pedido_number_seq');

-- Updated_at trigger for collections
CREATE TRIGGER trg_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
