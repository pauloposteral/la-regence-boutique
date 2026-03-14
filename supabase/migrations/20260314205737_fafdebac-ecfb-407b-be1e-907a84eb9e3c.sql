
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  assunto text,
  mensagem text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can send contact messages"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view contact messages"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
