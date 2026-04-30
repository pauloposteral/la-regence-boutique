-- 1) Newsletter double opt-in
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmation_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_uidx
  ON public.newsletter_subscribers (lower(email));

-- 2) Persistent carts (cross-device)
CREATE TABLE IF NOT EXISTS public.carts (
  user_id uuid PRIMARY KEY,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own cart" ON public.carts;
CREATE POLICY "Users manage own cart"
  ON public.carts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_cart_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS carts_touch_updated_at ON public.carts;
CREATE TRIGGER carts_touch_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_cart_updated_at();

-- 3) Abandoned cart tracking — on the existing pedidos table
CREATE INDEX IF NOT EXISTS pedidos_abandoned_idx
  ON public.pedidos (status, created_at)
  WHERE status = 'pendente';

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS abandoned_email_sent_at timestamptz;