
-- 1) Remove leitura pública de cupons; validação passa a ser feita via RPC preview_coupon/redeem_coupon (SECURITY DEFINER)
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.cupons;

-- Admins continuam gerenciando (política "Admins can manage coupons" mantida)
-- Garante EXECUTE nas RPCs para uso público/autenticado
GRANT EXECUTE ON FUNCTION public.preview_coupon(text, numeric) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text, numeric) TO anon, authenticated;

-- 2) Restringe upload no bucket public-assets apenas para admins
DROP POLICY IF EXISTS "Authenticated users can upload to public-assets" ON storage.objects;
-- Admins já cobertos pela política "Admins manage public-assets" (ALL)
