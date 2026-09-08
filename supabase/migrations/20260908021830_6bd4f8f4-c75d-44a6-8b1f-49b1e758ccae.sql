-- Restaura o acesso público de leitura da loja: as policies de admin (role public) chamam has_role
-- e, sem EXECUTE para anon, qualquer SELECT anônimo falhava com "permission denied for function has_role".
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;