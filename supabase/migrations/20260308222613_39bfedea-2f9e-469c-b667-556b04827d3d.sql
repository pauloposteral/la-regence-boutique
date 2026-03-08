
-- Points/Loyalty table
CREATE TABLE public.pontos_fidelidade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pontos integer NOT NULL,
  tipo text NOT NULL, -- 'ganho' or 'resgate'
  descricao text,
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast user queries
CREATE INDEX idx_pontos_user_id ON public.pontos_fidelidade(user_id);
CREATE INDEX idx_pontos_created_at ON public.pontos_fidelidade(created_at DESC);

-- Enable RLS
ALTER TABLE public.pontos_fidelidade ENABLE ROW LEVEL SECURITY;

-- Users can view own points
CREATE POLICY "Users can view own points"
  ON public.pontos_fidelidade FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all points
CREATE POLICY "Admins can manage points"
  ON public.pontos_fidelidade FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow insert for system (via triggers/functions)
CREATE POLICY "System can insert points"
  ON public.pontos_fidelidade FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to calculate total points for a user
CREATE OR REPLACE FUNCTION public.get_user_points(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(pontos), 0)::integer
  FROM public.pontos_fidelidade
  WHERE user_id = _user_id
$$;

-- Function to award points when order is delivered
CREATE OR REPLACE FUNCTION public.award_points_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only when status changes to 'entregue' and user_id is set
  IF NEW.status = 'entregue' AND OLD.status != 'entregue' AND NEW.user_id IS NOT NULL THEN
    -- Award 1 point per R$1 spent
    INSERT INTO public.pontos_fidelidade (user_id, pontos, tipo, descricao, pedido_id)
    VALUES (
      NEW.user_id,
      FLOOR(NEW.total)::integer,
      'ganho',
      'Pontos por pedido #' || UPPER(LEFT(NEW.id::text, 8)),
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on pedidos
CREATE TRIGGER trg_award_points_on_delivery
  AFTER UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_on_delivery();
