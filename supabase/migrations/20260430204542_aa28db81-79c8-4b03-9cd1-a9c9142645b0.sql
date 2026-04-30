-- Expande enum status_pedido com 5 novos valores (não-destrutivo)
-- Ordem de adição não importa para o app — usamos arrays explícitos no front
ALTER TYPE public.status_pedido ADD VALUE IF NOT EXISTS 'pago';
ALTER TYPE public.status_pedido ADD VALUE IF NOT EXISTS 'torrando';
ALTER TYPE public.status_pedido ADD VALUE IF NOT EXISTS 'embalando';
ALTER TYPE public.status_pedido ADD VALUE IF NOT EXISTS 'saiu_para_entrega';
ALTER TYPE public.status_pedido ADD VALUE IF NOT EXISTS 'reembolsado';