
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);

ALTER TABLE public.assinaturas ADD COLUMN IF NOT EXISTS stripe_price_id text;
ALTER TABLE public.assinaturas ADD COLUMN IF NOT EXISTS cancela_em timestamptz;
CREATE INDEX IF NOT EXISTS idx_assinaturas_stripe_sub ON public.assinaturas(stripe_subscription_id);
