
-- Enrich profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_roast text,
  ADD COLUMN IF NOT EXISTS preferred_grind text,
  ADD COLUMN IF NOT EXISTS loyalty_tier text DEFAULT 'bronze';

-- Enrich avaliacoes table
ALTER TABLE public.avaliacoes
  ADD COLUMN IF NOT EXISTS titulo text,
  ADD COLUMN IF NOT EXISTS aroma integer,
  ADD COLUMN IF NOT EXISTS sabor integer,
  ADD COLUMN IF NOT EXISTS finalizacao integer,
  ADD COLUMN IF NOT EXISTS compra_verificada boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS resposta_admin text,
  ADD COLUMN IF NOT EXISTS resposta_admin_at timestamptz;

-- Function to calculate loyalty tier based on points
CREATE OR REPLACE FUNCTION public.calculate_loyalty_tier(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE
    WHEN COALESCE(SUM(pontos), 0) >= 4000 THEN 'platinum'
    WHEN COALESCE(SUM(pontos), 0) >= 1500 THEN 'gold'
    WHEN COALESCE(SUM(pontos), 0) >= 500 THEN 'silver'
    ELSE 'bronze'
  END
  FROM public.pontos_fidelidade
  WHERE user_id = _user_id
$$;

-- Trigger to update loyalty_tier when points change
CREATE OR REPLACE FUNCTION public.update_loyalty_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET loyalty_tier = public.calculate_loyalty_tier(NEW.user_id)
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_loyalty_tier ON public.pontos_fidelidade;
CREATE TRIGGER trg_update_loyalty_tier
  AFTER INSERT ON public.pontos_fidelidade
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loyalty_tier();
