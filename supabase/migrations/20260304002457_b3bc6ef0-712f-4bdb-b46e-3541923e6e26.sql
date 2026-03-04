
-- Fix overly permissive INSERT policy on itens_pedido
DROP POLICY "Users can create order items" ON public.itens_pedido;
CREATE POLICY "Users can create order items" ON public.itens_pedido 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pedidos 
    WHERE pedidos.id = itens_pedido.pedido_id 
    AND (pedidos.user_id = auth.uid() OR pedidos.user_id IS NULL)
  )
);
