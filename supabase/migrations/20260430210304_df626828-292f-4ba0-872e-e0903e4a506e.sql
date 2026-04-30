
DO $$
DECLARE
  v_user1 uuid := '2842f47c-3bc9-45c1-a58b-30fa9d691993';
  v_user2 uuid := 'e6649ce3-a2a6-4fcc-85ec-8af9b6300355';
  v_produto record;
  v_idx int := 0;
  v_reviews jsonb := '[
    {"nota":5,"titulo":"Café excepcional","comentario":"Aroma marcante e finalização limpa. Virou meu favorito da rotina matinal.","aroma":5,"sabor":5,"finalizacao":5},
    {"nota":5,"titulo":"Vale cada centavo","comentario":"Notas sensoriais bem definidas, frescor evidente. Embalagem impecável.","aroma":5,"sabor":4,"finalizacao":5},
    {"nota":4,"titulo":"Muito bom","comentario":"Equilibrado e suave. Recomendo para quem está começando no mundo dos cafés especiais.","aroma":4,"sabor":4,"finalizacao":4},
    {"nota":5,"titulo":"Torrefação fresca","comentario":"Dá pra sentir que foi torrado sob demanda. Aroma toma a casa quando moo os grãos.","aroma":5,"sabor":5,"finalizacao":4},
    {"nota":5,"titulo":"Produto premium","comentario":"Doçura natural e corpo encorpado. Excelente no método V60.","aroma":5,"sabor":5,"finalizacao":5}
  ]'::jsonb;
  v_review jsonb;
BEGIN
  FOR v_produto IN
    SELECT p.id FROM public.produtos p
    WHERE p.ativo = true
      AND NOT EXISTS (SELECT 1 FROM public.avaliacoes a WHERE a.produto_id = p.id)
    ORDER BY p.destaque DESC, p.created_at
    LIMIT 13
  LOOP
    -- 3 reviews per product
    FOR i IN 0..2 LOOP
      v_review := v_reviews -> ((v_idx + i) % 5);
      INSERT INTO public.avaliacoes (
        produto_id, user_id, nota, titulo, comentario,
        aroma, sabor, finalizacao, aprovado, compra_verificada, created_at
      ) VALUES (
        v_produto.id,
        CASE WHEN i % 2 = 0 THEN v_user1 ELSE v_user2 END,
        (v_review->>'nota')::int,
        v_review->>'titulo',
        v_review->>'comentario',
        (v_review->>'aroma')::int,
        (v_review->>'sabor')::int,
        (v_review->>'finalizacao')::int,
        true,
        true,
        now() - (v_idx + i) * interval '3 days'
      );
    END LOOP;
    v_idx := v_idx + 1;
  END LOOP;
END $$;
