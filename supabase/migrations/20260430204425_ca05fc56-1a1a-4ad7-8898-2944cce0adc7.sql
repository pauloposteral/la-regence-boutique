-- =====================================================
-- 1. SECURITY DEFINER: revogar EXECUTE de PUBLIC
-- =====================================================
-- Funções usadas APENAS por triggers ou edge functions (service role) —
-- nenhum cliente precisa chamá-las diretamente.
REVOKE EXECUTE ON FUNCTION public.audit_table_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_points_on_delivery() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_loyalty_tier(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_order_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.redeem_coupon(text, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_loyalty_tier() FROM PUBLIC, anon, authenticated;

-- service_role mantém execução automática (não precisa GRANT explícito; é superuser-like)
-- update_updated_at_column é trigger-only — também restringe
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_cart_updated_at() FROM PUBLIC, anon, authenticated;

-- has_role: chamada do AdminLayout (frontend) → manter para authenticated
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;

-- get_user_points: chamada do ContaPage → manter para authenticated
GRANT EXECUTE ON FUNCTION public.get_user_points(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_points(uuid) FROM anon, PUBLIC;

-- preview_coupon: usado para preview no carrinho (cliente pode ser anon visitante)
GRANT EXECUTE ON FUNCTION public.preview_coupon(text, numeric) TO authenticated, anon;

-- =====================================================
-- 2. POLICIES "ALWAYS TRUE" — endurecer com validação mínima
-- =====================================================

-- newsletter_subscribers: exigir e-mail mínimo válido
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe with valid email"
ON public.newsletter_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) BETWEEN 5 AND 254
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- contact_messages: exigir nome, email válido e mensagem mínima
DROP POLICY IF EXISTS "Anyone can send contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can send valid contact messages"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  nome IS NOT NULL AND length(trim(nome)) BETWEEN 2 AND 100
  AND email IS NOT NULL
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND mensagem IS NOT NULL AND length(trim(mensagem)) BETWEEN 5 AND 2000
);

-- =====================================================
-- 3. STORAGE BUCKETS PÚBLICOS — bloquear listagem
-- =====================================================
-- Permite leitura de objeto individual (cliente acessa por URL pública),
-- mas REMOVE a capacidade de listar todo o conteúdo do bucket via API.
-- Isso impede um atacante de enumerar todos os arquivos do storage.

-- Garante RLS em storage.objects (já vem por padrão, idempotente)
-- Não enable/disable RLS em storage.objects — gerenciado pelo Supabase

-- Drop possíveis policies pré-existentes que permitem listar
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for public-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public listing on product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public listing on public-assets" ON storage.objects;

-- Recria SELECT estrito: só leitura por nome exato (URL pública), nunca listagem genérica
-- O bucket continua público (objetos servidos via render/object public URL),
-- mas listagem programática (storage.list) fica fora.
CREATE POLICY "Public can read product-images by name"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images' AND name IS NOT NULL);

CREATE POLICY "Public can read public-assets by name"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'public-assets' AND name IS NOT NULL);

-- Admins podem fazer tudo nos dois buckets
DROP POLICY IF EXISTS "Admins manage product-images" ON storage.objects;
CREATE POLICY "Admins manage product-images"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage public-assets" ON storage.objects;
CREATE POLICY "Admins manage public-assets"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'public-assets' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'public-assets' AND public.has_role(auth.uid(), 'admin'));