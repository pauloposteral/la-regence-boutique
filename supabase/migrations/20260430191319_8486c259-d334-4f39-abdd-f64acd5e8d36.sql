-- ============ Rate Limits ============
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS rate_limits_key_window_idx
  ON public.rate_limits (key, window_start);

CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx
  ON public.rate_limits (window_start);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No client access — only service role uses this table
CREATE POLICY "Block client access to rate_limits"
  ON public.rate_limits
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- Atomic check + increment
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _key text,
  _max_requests integer,
  _window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_count integer;
BEGIN
  v_window_start := date_trunc('minute', now()) -
    make_interval(secs => (extract(second from now())::int / _window_seconds) * 0);
  -- bucket by floor(now / window)
  v_window_start := to_timestamp(floor(extract(epoch from now()) / _window_seconds) * _window_seconds);

  INSERT INTO public.rate_limits (key, window_start, count)
  VALUES (_key, v_window_start, 1)
  ON CONFLICT (key, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO v_count;

  -- Cleanup old buckets (best-effort, every ~100 calls statistically)
  IF random() < 0.01 THEN
    DELETE FROM public.rate_limits
    WHERE window_start < now() - interval '1 hour';
  END IF;

  RETURN v_count <= _max_requests;
END;
$$;

-- ============ Performance indexes ============
CREATE INDEX IF NOT EXISTS produtos_ativo_destaque_idx
  ON public.produtos (ativo, destaque) WHERE ativo = true;

CREATE UNIQUE INDEX IF NOT EXISTS produtos_slug_unique_idx
  ON public.produtos (slug);

CREATE INDEX IF NOT EXISTS pedidos_user_created_idx
  ON public.pedidos (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS pedidos_status_created_idx
  ON public.pedidos (status, created_at DESC);

CREATE INDEX IF NOT EXISTS pontos_fidelidade_user_idx
  ON public.pontos_fidelidade (user_id);

CREATE INDEX IF NOT EXISTS favoritos_user_idx
  ON public.favoritos (user_id);

CREATE INDEX IF NOT EXISTS itens_pedido_pedido_idx
  ON public.itens_pedido (pedido_id);

CREATE INDEX IF NOT EXISTS variantes_produto_idx
  ON public.variantes (produto_id) WHERE ativo = true;

CREATE INDEX IF NOT EXISTS produto_imagens_produto_idx
  ON public.produto_imagens (produto_id, ordem);

CREATE INDEX IF NOT EXISTS avaliacoes_produto_aprovado_idx
  ON public.avaliacoes (produto_id, aprovado) WHERE aprovado = true;