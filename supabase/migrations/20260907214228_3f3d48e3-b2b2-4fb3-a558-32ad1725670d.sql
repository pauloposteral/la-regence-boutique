-- 1) Assinaturas: endereço de entrega
ALTER TABLE public.assinaturas
  ADD COLUMN IF NOT EXISTS endereco_id uuid REFERENCES public.enderecos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS endereco_entrega jsonb,
  ADD COLUMN IF NOT EXISTS telefone_contato text;

-- 2) Ciclos de entrega
CREATE TYPE public.status_ciclo AS ENUM ('awaiting_address','ready_to_ship','shipped','delivered','problem');

CREATE TABLE public.assinatura_ciclos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assinatura_id uuid NOT NULL REFERENCES public.assinaturas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  numero integer NOT NULL DEFAULT 1,
  periodo_ref text NOT NULL,
  status public.status_ciclo NOT NULL DEFAULT 'awaiting_address',
  endereco_snapshot jsonb,
  preferencias_snapshot jsonb,
  despachar_ate date,
  despachado_em timestamptz,
  transportadora text,
  codigo_rastreio text,
  url_rastreio text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assinatura_id, periodo_ref)
);

GRANT SELECT ON public.assinatura_ciclos TO authenticated;
GRANT ALL ON public.assinatura_ciclos TO service_role;
ALTER TABLE public.assinatura_ciclos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own cycles" ON public.assinatura_ciclos
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage cycles" ON public.assinatura_ciclos
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_assinatura_ciclos_updated_at
  BEFORE UPDATE ON public.assinatura_ciclos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ciclos_status ON public.assinatura_ciclos(status);
CREATE INDEX idx_ciclos_assinatura ON public.assinatura_ciclos(assinatura_id);

-- 3) Registro de avisos (notificações)
CREATE TABLE public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  canal text NOT NULL DEFAULT 'email',
  destinatario text NOT NULL,
  assunto text,
  assinatura_id uuid REFERENCES public.assinaturas(id) ON DELETE SET NULL,
  ciclo_id uuid REFERENCES public.assinatura_ciclos(id) ON DELETE SET NULL,
  pedido_id uuid,
  provider_message_id text,
  status text NOT NULL DEFAULT 'queued',
  tentativas integer NOT NULL DEFAULT 0,
  ultimo_erro text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.notification_log TO authenticated;
GRANT ALL ON public.notification_log TO service_role;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view notifications" ON public.notification_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_notification_log_assinatura ON public.notification_log(assinatura_id);
CREATE INDEX idx_notification_log_tipo ON public.notification_log(tipo);

-- 4) Tokens de ação (informar endereço sem login)
CREATE TABLE public.action_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assinatura_id uuid REFERENCES public.assinaturas(id) ON DELETE CASCADE,
  purpose text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.action_tokens TO service_role;
ALTER TABLE public.action_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.action_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);