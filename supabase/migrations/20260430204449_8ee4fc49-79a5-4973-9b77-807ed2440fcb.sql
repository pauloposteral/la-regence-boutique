-- Remove policy redundante e mais ampla que ainda permitia listagem
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

-- A policy "Public can read product-images by name" criada anteriormente
-- continua permitindo abrir arquivos por URL pública (necessário para a loja)
-- mas exige bucket_id explícito e name não-nulo, impedindo listagem genérica.