
-- 1) Tabela de regras de frete grátis
CREATE TABLE IF NOT EXISTS public.regras_frete_gratis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  uf text,
  valor_minimo numeric(10,2) NOT NULL DEFAULT 0,
  prioridade integer NOT NULL DEFAULT 100,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.regras_frete_gratis TO anon, authenticated;
GRANT ALL ON public.regras_frete_gratis TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.regras_frete_gratis TO authenticated;

ALTER TABLE public.regras_frete_gratis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads active shipping rules" ON public.regras_frete_gratis;
CREATE POLICY "Public reads active shipping rules"
  ON public.regras_frete_gratis FOR SELECT
  USING (ativa = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage shipping rules" ON public.regras_frete_gratis;
CREATE POLICY "Admins manage shipping rules"
  ON public.regras_frete_gratis FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_regras_frete_gratis_updated_at ON public.regras_frete_gratis;
CREATE TRIGGER trg_regras_frete_gratis_updated_at
  BEFORE UPDATE ON public.regras_frete_gratis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.regras_frete_gratis (nome, uf, valor_minimo, prioridade, ativa)
SELECT 'Frete grátis Brasil', NULL, 150, 100, true
WHERE NOT EXISTS (SELECT 1 FROM public.regras_frete_gratis WHERE nome='Frete grátis Brasil');

INSERT INTO public.regras_frete_gratis (nome, uf, valor_minimo, prioridade, ativa)
SELECT 'Frete grátis SP', 'SP', 100, 50, true
WHERE NOT EXISTS (SELECT 1 FROM public.regras_frete_gratis WHERE nome='Frete grátis SP');

-- 2) Coluna tipo em cupons
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='cupons' AND column_name='tipo'
  ) THEN
    ALTER TABLE public.cupons ADD COLUMN tipo text NOT NULL DEFAULT 'desconto';
    ALTER TABLE public.cupons ADD CONSTRAINT cupons_tipo_check
      CHECK (tipo IN ('desconto','frete_gratis'));
  END IF;
END $$;

-- 3) Drop + recreate RPCs para nova assinatura
DROP FUNCTION IF EXISTS public.preview_coupon(text, numeric);
CREATE FUNCTION public.preview_coupon(_codigo text, _subtotal numeric)
 RETURNS TABLE(desconto numeric, motivo text, tipo text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  c RECORD;
  v_desconto numeric := 0;
BEGIN
  SELECT * INTO c FROM public.cupons
  WHERE upper(cupons.codigo) = upper(_codigo) AND ativo = true;

  IF NOT FOUND THEN RETURN QUERY SELECT 0::numeric, 'invalido'::text, NULL::text; RETURN; END IF;
  IF c.valido_ate IS NOT NULL AND c.valido_ate < now() THEN RETURN QUERY SELECT 0::numeric, 'expirado'::text, c.tipo; RETURN; END IF;
  IF c.usos_restantes IS NOT NULL AND c.usos_restantes <= 0 THEN RETURN QUERY SELECT 0::numeric, 'esgotado'::text, c.tipo; RETURN; END IF;
  IF c.valor_minimo IS NOT NULL AND _subtotal < c.valor_minimo THEN RETURN QUERY SELECT 0::numeric, 'valor_minimo'::text, c.tipo; RETURN; END IF;

  IF c.tipo = 'frete_gratis' THEN
    v_desconto := 0;
  ELSIF c.desconto_percentual IS NOT NULL THEN
    v_desconto := round((_subtotal * c.desconto_percentual / 100)::numeric, 2);
  ELSIF c.desconto_valor IS NOT NULL THEN
    v_desconto := least(c.desconto_valor, _subtotal);
  END IF;

  RETURN QUERY SELECT v_desconto, 'ok'::text, c.tipo;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.preview_coupon(text, numeric) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.redeem_coupon(text, numeric);
CREATE FUNCTION public.redeem_coupon(_codigo text, _subtotal numeric)
 RETURNS TABLE(cupom_id uuid, desconto numeric, codigo text, motivo text, tipo text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  c RECORD;
  v_desconto numeric := 0;
BEGIN
  SELECT * INTO c FROM public.cupons
  WHERE upper(cupons.codigo) = upper(_codigo) AND ativo = true FOR UPDATE;

  IF NOT FOUND THEN RETURN QUERY SELECT NULL::uuid, 0::numeric, _codigo, 'invalido'::text, NULL::text; RETURN; END IF;
  IF c.valido_ate IS NOT NULL AND c.valido_ate < now() THEN RETURN QUERY SELECT NULL::uuid, 0::numeric, _codigo, 'expirado'::text, c.tipo; RETURN; END IF;
  IF c.usos_restantes IS NOT NULL AND c.usos_restantes <= 0 THEN RETURN QUERY SELECT NULL::uuid, 0::numeric, _codigo, 'esgotado'::text, c.tipo; RETURN; END IF;
  IF c.valor_minimo IS NOT NULL AND _subtotal < c.valor_minimo THEN RETURN QUERY SELECT NULL::uuid, 0::numeric, _codigo, 'valor_minimo'::text, c.tipo; RETURN; END IF;

  IF c.tipo = 'frete_gratis' THEN
    v_desconto := 0;
  ELSIF c.desconto_percentual IS NOT NULL THEN
    v_desconto := round((_subtotal * c.desconto_percentual / 100)::numeric, 2);
  ELSIF c.desconto_valor IS NOT NULL THEN
    v_desconto := least(c.desconto_valor, _subtotal);
  END IF;

  IF c.usos_restantes IS NOT NULL THEN
    UPDATE public.cupons SET usos_restantes = usos_restantes - 1 WHERE id = c.id;
  END IF;

  RETURN QUERY SELECT c.id, v_desconto, c.codigo, 'ok'::text, c.tipo;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.redeem_coupon(text, numeric) TO anon, authenticated;
