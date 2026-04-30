
-- Atomic coupon redeem: validates + decrements in single statement
CREATE OR REPLACE FUNCTION public.redeem_coupon(
  _codigo text,
  _subtotal numeric
)
RETURNS TABLE (
  cupom_id uuid,
  desconto numeric,
  codigo text,
  motivo text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c RECORD;
  v_desconto numeric := 0;
BEGIN
  SELECT * INTO c
  FROM public.cupons
  WHERE upper(cupons.codigo) = upper(_codigo)
    AND ativo = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, 0::numeric, _codigo, 'invalido'::text;
    RETURN;
  END IF;

  IF c.valido_ate IS NOT NULL AND c.valido_ate < now() THEN
    RETURN QUERY SELECT NULL::uuid, 0::numeric, _codigo, 'expirado'::text;
    RETURN;
  END IF;

  IF c.usos_restantes IS NOT NULL AND c.usos_restantes <= 0 THEN
    RETURN QUERY SELECT NULL::uuid, 0::numeric, _codigo, 'esgotado'::text;
    RETURN;
  END IF;

  IF c.valor_minimo IS NOT NULL AND _subtotal < c.valor_minimo THEN
    RETURN QUERY SELECT NULL::uuid, 0::numeric, _codigo, 'valor_minimo'::text;
    RETURN;
  END IF;

  IF c.desconto_percentual IS NOT NULL THEN
    v_desconto := round((_subtotal * c.desconto_percentual / 100)::numeric, 2);
  ELSIF c.desconto_valor IS NOT NULL THEN
    v_desconto := least(c.desconto_valor, _subtotal);
  END IF;

  IF c.usos_restantes IS NOT NULL THEN
    UPDATE public.cupons SET usos_restantes = usos_restantes - 1 WHERE id = c.id;
  END IF;

  RETURN QUERY SELECT c.id, v_desconto, c.codigo, 'ok'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_coupon(text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text, numeric) TO service_role;

-- Read-only preview (no decrement) for cart/checkout feedback
CREATE OR REPLACE FUNCTION public.preview_coupon(
  _codigo text,
  _subtotal numeric
)
RETURNS TABLE (
  desconto numeric,
  motivo text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c RECORD;
  v_desconto numeric := 0;
BEGIN
  SELECT * INTO c FROM public.cupons
  WHERE upper(cupons.codigo) = upper(_codigo) AND ativo = true;

  IF NOT FOUND THEN RETURN QUERY SELECT 0::numeric, 'invalido'::text; RETURN; END IF;
  IF c.valido_ate IS NOT NULL AND c.valido_ate < now() THEN RETURN QUERY SELECT 0::numeric, 'expirado'::text; RETURN; END IF;
  IF c.usos_restantes IS NOT NULL AND c.usos_restantes <= 0 THEN RETURN QUERY SELECT 0::numeric, 'esgotado'::text; RETURN; END IF;
  IF c.valor_minimo IS NOT NULL AND _subtotal < c.valor_minimo THEN RETURN QUERY SELECT 0::numeric, 'valor_minimo'::text; RETURN; END IF;

  IF c.desconto_percentual IS NOT NULL THEN
    v_desconto := round((_subtotal * c.desconto_percentual / 100)::numeric, 2);
  ELSIF c.desconto_valor IS NOT NULL THEN
    v_desconto := least(c.desconto_valor, _subtotal);
  END IF;

  RETURN QUERY SELECT v_desconto, 'ok'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.preview_coupon(text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preview_coupon(text, numeric) TO anon, authenticated;
