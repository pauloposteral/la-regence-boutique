
DROP POLICY IF EXISTS "anyone_can_subscribe_restock" ON public.notify_restock;

CREATE POLICY "subscribe_restock_validated" ON public.notify_restock
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (
      auth.uid() IS NULL
      OR user_id IS NULL
      OR user_id = auth.uid()
    )
  );
