CREATE TABLE public.webhook_events (
  event_id text PRIMARY KEY,
  provider text NOT NULL DEFAULT 'stripe',
  event_type text,
  processed_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_read_webhook_events" ON public.webhook_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));