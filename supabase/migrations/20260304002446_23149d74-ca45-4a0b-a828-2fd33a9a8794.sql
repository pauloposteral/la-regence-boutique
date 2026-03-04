
-- =============================================
-- La Régence — Full Database Schema
-- =============================================

-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.tipo_torra AS ENUM ('clara', 'media', 'media_escura', 'escura');
CREATE TYPE public.tipo_moagem AS ENUM ('graos', 'grossa', 'media', 'fina', 'extra_fina');
CREATE TYPE public.status_pedido AS ENUM ('pendente', 'confirmado', 'preparando', 'enviado', 'entregue', 'cancelado');
CREATE TYPE public.tipo_assinatura AS ENUM ('mensal', 'trimestral', 'semestral');
CREATE TYPE public.status_assinatura AS ENUM ('ativa', 'pausada', 'cancelada');

-- FUNCTION: update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- USER ROLES (must be created BEFORE has_role function)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- FUNCTION: has_role (security definer, avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles (after has_role exists)
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PROFILES
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  cpf TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- CATEGORIAS
-- =============================================
CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  imagem_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active categories" ON public.categorias FOR SELECT USING (ativo = true);
CREATE POLICY "Admins can manage categories" ON public.categorias FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PRODUTOS
-- =============================================
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID REFERENCES public.categorias(id),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  descricao_sensorial TEXT,
  notas_sensoriais TEXT[] DEFAULT '{}',
  sca_score INT,
  variedade TEXT,
  processo TEXT,
  origem TEXT,
  altitude TEXT,
  safra TEXT,
  tipo_torra tipo_torra DEFAULT 'media',
  corpo INT CHECK (corpo BETWEEN 1 AND 5),
  acidez INT CHECK (acidez BETWEEN 1 AND 5),
  docura INT CHECK (docura BETWEEN 1 AND 5),
  retrogosto INT CHECK (retrogosto BETWEEN 1 AND 5),
  preco DECIMAL(10,2) NOT NULL,
  preco_promocional DECIMAL(10,2),
  estoque INT NOT NULL DEFAULT 0,
  estoque_minimo INT NOT NULL DEFAULT 5,
  ativo BOOLEAN NOT NULL DEFAULT true,
  destaque BOOLEAN NOT NULL DEFAULT false,
  peso_padrao INT DEFAULT 250,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active products" ON public.produtos FOR SELECT USING (ativo = true);
CREATE POLICY "Admins can manage products" ON public.produtos FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_produtos_slug ON public.produtos(slug);
CREATE INDEX idx_produtos_categoria ON public.produtos(categoria_id);
CREATE INDEX idx_produtos_sca ON public.produtos(sca_score);
CREATE INDEX idx_produtos_notas ON public.produtos USING GIN(notas_sensoriais);
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- VARIANTES
-- =============================================
CREATE TABLE public.variantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  moagem tipo_moagem NOT NULL,
  peso INT NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  estoque INT NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.variantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active variants" ON public.variantes FOR SELECT USING (ativo = true);
CREATE POLICY "Admins can manage variants" ON public.variantes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PRODUTO_IMAGENS
-- =============================================
CREATE TABLE public.produto_imagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  principal BOOLEAN NOT NULL DEFAULT false,
  ordem INT NOT NULL DEFAULT 0
);
ALTER TABLE public.produto_imagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view product images" ON public.produto_imagens FOR SELECT USING (true);
CREATE POLICY "Admins can manage images" ON public.produto_imagens FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- AVALIACOES
-- =============================================
CREATE TABLE public.avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nota INT NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario TEXT,
  aprovado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved reviews" ON public.avaliacoes FOR SELECT USING (aprovado = true);
CREATE POLICY "Users can create reviews" ON public.avaliacoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own reviews" ON public.avaliacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage reviews" ON public.avaliacoes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- ENDERECOS
-- =============================================
CREATE TABLE public.enderecos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  apelido TEXT,
  cep TEXT NOT NULL,
  logradouro TEXT NOT NULL,
  numero TEXT NOT NULL,
  complemento TEXT,
  bairro TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  principal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.enderecos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own addresses" ON public.enderecos FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_enderecos_updated_at BEFORE UPDATE ON public.enderecos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- CUPONS
-- =============================================
CREATE TABLE public.cupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  desconto_percentual DECIMAL(5,2),
  desconto_valor DECIMAL(10,2),
  valor_minimo DECIMAL(10,2),
  usos_restantes INT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  valido_ate TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active coupons" ON public.cupons FOR SELECT USING (ativo = true);
CREATE POLICY "Admins can manage coupons" ON public.cupons FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PEDIDOS
-- =============================================
CREATE TABLE public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email_visitante TEXT,
  status status_pedido NOT NULL DEFAULT 'pendente',
  subtotal DECIMAL(10,2) NOT NULL,
  desconto DECIMAL(10,2) DEFAULT 0,
  frete DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  cupom_id UUID REFERENCES public.cupons(id),
  endereco_entrega JSONB,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  metodo_pagamento TEXT,
  presente BOOLEAN DEFAULT false,
  mensagem_presente TEXT,
  codigo_rastreamento TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON public.pedidos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.pedidos FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Admins can manage orders" ON public.pedidos FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_pedidos_user ON public.pedidos(user_id);
CREATE INDEX idx_pedidos_status ON public.pedidos(status);
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ITENS_PEDIDO
-- =============================================
CREATE TABLE public.itens_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  variante_id UUID REFERENCES public.variantes(id),
  quantidade INT NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own order items" ON public.itens_pedido FOR SELECT USING (EXISTS (SELECT 1 FROM public.pedidos WHERE pedidos.id = itens_pedido.pedido_id AND pedidos.user_id = auth.uid()));
CREATE POLICY "Users can create order items" ON public.itens_pedido FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage order items" ON public.itens_pedido FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- ASSINATURAS
-- =============================================
CREATE TABLE public.assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo tipo_assinatura NOT NULL,
  status status_assinatura NOT NULL DEFAULT 'ativa',
  produto_id UUID REFERENCES public.produtos(id),
  cafe_surpresa BOOLEAN DEFAULT false,
  moagem tipo_moagem,
  metodo_preparo TEXT,
  stripe_subscription_id TEXT,
  preco DECIMAL(10,2) NOT NULL,
  proxima_entrega TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON public.assinaturas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create subscriptions" ON public.assinaturas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.assinaturas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage subscriptions" ON public.assinaturas FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_assinaturas_updated_at BEFORE UPDATE ON public.assinaturas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- FAVORITOS
-- =============================================
CREATE TABLE public.favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, produto_id)
);
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own favorites" ON public.favoritos FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- BLOG_POSTS
-- =============================================
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  conteudo TEXT,
  resumo TEXT,
  imagem_url TEXT,
  autor_id UUID REFERENCES auth.users(id),
  publicado BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published posts" ON public.blog_posts FOR SELECT USING (publicado = true);
CREATE POLICY "Admins can manage posts" ON public.blog_posts FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_blog_slug ON public.blog_posts(slug);
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- BANNERS
-- =============================================
CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  imagem_url TEXT,
  link TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT USING (ativo = true);
CREATE POLICY "Admins can manage banners" ON public.banners FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- STORAGE
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update product images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete product images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
