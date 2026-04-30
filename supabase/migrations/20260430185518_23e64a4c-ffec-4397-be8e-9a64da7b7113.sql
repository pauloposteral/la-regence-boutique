
-- ============================================================
-- HARDENING RLS: restrict {public} → {authenticated} on PII tables
-- Keeps existing admin overrides via has_role()
-- Anonymous (anon) is implicitly denied because no policy targets it
-- ============================================================

-- ============ PROFILES ============
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============ ENDERECOS ============
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.enderecos;

CREATE POLICY "Users can manage own addresses"
ON public.enderecos FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============ PEDIDOS ============
DROP POLICY IF EXISTS "Users can view own orders" ON public.pedidos;
DROP POLICY IF EXISTS "Users can create orders" ON public.pedidos;

CREATE POLICY "Users can view own orders"
ON public.pedidos FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Guest checkout (user_id NULL) is created by edge function via service role,
-- so client-side INSERT requires authentication and matching user_id.
CREATE POLICY "Users can create orders"
ON public.pedidos FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ============ ITENS_PEDIDO ============
DROP POLICY IF EXISTS "Users can view own order items" ON public.itens_pedido;
DROP POLICY IF EXISTS "Users can create order items" ON public.itens_pedido;

CREATE POLICY "Users can view own order items"
ON public.itens_pedido FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.pedidos
  WHERE pedidos.id = itens_pedido.pedido_id
    AND pedidos.user_id = auth.uid()
));

CREATE POLICY "Users can create order items"
ON public.itens_pedido FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.pedidos
  WHERE pedidos.id = itens_pedido.pedido_id
    AND pedidos.user_id = auth.uid()
));

-- ============ ASSINATURAS ============
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.assinaturas;
DROP POLICY IF EXISTS "Users can create subscriptions" ON public.assinaturas;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.assinaturas;

CREATE POLICY "Users can view own subscriptions"
ON public.assinaturas FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create subscriptions"
ON public.assinaturas FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
ON public.assinaturas FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============ PONTOS_FIDELIDADE ============
-- Already on {authenticated}, but redo for explicit consistency
DROP POLICY IF EXISTS "Users can view own points" ON public.pontos_fidelidade;
DROP POLICY IF EXISTS "Users can redeem points" ON public.pontos_fidelidade;

CREATE POLICY "Users can view own points"
ON public.pontos_fidelidade FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can redeem points"
ON public.pontos_fidelidade FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND tipo = 'resgate' AND pontos < 0);

-- ============ FAVORITOS ============
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favoritos;

CREATE POLICY "Users can manage own favorites"
ON public.favoritos FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============ AVALIACOES (review hardening) ============
-- Keep public SELECT for approved reviews (needed for product page),
-- but restrict user-scoped policies to authenticated.
DROP POLICY IF EXISTS "Users can view own reviews" ON public.avaliacoes;
DROP POLICY IF EXISTS "Users can create reviews" ON public.avaliacoes;

CREATE POLICY "Users can view own reviews"
ON public.avaliacoes FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create reviews"
ON public.avaliacoes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ============ USER_ROLES ============
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);
