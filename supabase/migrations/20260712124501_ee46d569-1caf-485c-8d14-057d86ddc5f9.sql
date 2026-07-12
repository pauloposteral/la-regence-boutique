
CREATE TABLE IF NOT EXISTS public.notify_restock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  variante_id UUID REFERENCES public.variantes(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notify_restock_unique
  ON public.notify_restock(produto_id, COALESCE(variante_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(email))
  WHERE notified_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notify_restock_pending
  ON public.notify_restock(produto_id) WHERE notified_at IS NULL;

GRANT SELECT, INSERT ON public.notify_restock TO anon, authenticated;
GRANT ALL ON public.notify_restock TO service_role;

ALTER TABLE public.notify_restock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_subscribe_restock" ON public.notify_restock
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "user_sees_own_subscriptions" ON public.notify_restock
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
