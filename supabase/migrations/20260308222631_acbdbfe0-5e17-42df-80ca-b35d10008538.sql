
-- Fix: Replace the overly permissive insert policy with a more specific one
-- Points should only be inserted via the trigger (SECURITY DEFINER) or by the user redeeming
DROP POLICY "System can insert points" ON public.pontos_fidelidade;

-- Users can only insert 'resgate' (redemption) type points with negative values
CREATE POLICY "Users can redeem points"
  ON public.pontos_fidelidade FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND tipo = 'resgate' AND pontos < 0);
