-- Save the complete programming order without bypassing the existing admin RLS.
CREATE OR REPLACE FUNCTION public.reorder_tv_videos(
  p_ordered_ids uuid[],
  p_expected_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_current_ids uuid[];
  v_ordered_count integer;
  v_updated_count integer;
BEGIN
  -- Check authorization before acquiring a lock or inspecting the catalog.
  IF v_user_id IS NULL
    OR NOT COALESCE(public.has_role(v_user_id, 'admin'::public.app_role), false) THEN
    RAISE EXCEPTION 'Somente administradores podem organizar a programação.'
      USING ERRCODE = '42501';
  END IF;

  IF p_ordered_ids IS NULL OR p_expected_ids IS NULL
    OR COALESCE(pg_catalog.array_ndims(p_ordered_ids), 1) <> 1
    OR COALESCE(pg_catalog.array_ndims(p_expected_ids), 1) <> 1 THEN
    RAISE EXCEPTION 'Informe a ordem completa e a programação de referência.'
      USING ERRCODE = '22023';
  END IF;

  v_ordered_count := pg_catalog.cardinality(p_ordered_ids);
  IF v_ordered_count > 999999
    OR pg_catalog.cardinality(p_expected_ids) > 999999 THEN
    RAISE EXCEPTION 'A programação ultrapassa o limite de posições permitido.'
      USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.array_position(p_ordered_ids, NULL::uuid) IS NOT NULL
    OR pg_catalog.array_position(p_expected_ids, NULL::uuid) IS NOT NULL
    OR v_ordered_count <> (
      SELECT pg_catalog.count(DISTINCT input.id)
      FROM pg_catalog.unnest(p_ordered_ids) AS input(id)
    )
    OR pg_catalog.cardinality(p_expected_ids) <> (
      SELECT pg_catalog.count(DISTINCT input.id)
      FROM pg_catalog.unnest(p_expected_ids) AS input(id)
    ) THEN
    RAISE EXCEPTION 'A programação não pode conter IDs vazios ou repetidos.'
      USING ERRCODE = '22023';
  END IF;

  -- The proposed order must be a permutation of the caller's complete snapshot.
  IF v_ordered_count <> pg_catalog.cardinality(p_expected_ids)
    OR EXISTS (
      SELECT input.id FROM pg_catalog.unnest(p_ordered_ids) AS input(id)
      EXCEPT
      SELECT input.id FROM pg_catalog.unnest(p_expected_ids) AS input(id)
    ) THEN
    RAISE EXCEPTION 'Inclua exatamente uma vez todos os vídeos não arquivados.'
      USING ERRCODE = '22023';
  END IF;

  -- authenticated already has table UPDATE, which permits this lock as invoker.
  -- It also serializes uploads and ordinary row updates during validation/save.
  LOCK TABLE public.tv_videos IN SHARE ROW EXCLUSIVE MODE;

  SELECT COALESCE(
    pg_catalog.array_agg(video.id ORDER BY video.sort_order, video.id),
    ARRAY[]::uuid[]
  )
  INTO v_current_ids
  FROM public.tv_videos AS video
  WHERE video.archived_at IS NULL;

  -- Normalize array bounds while preserving the expected sequence of IDs.
  IF v_current_ids IS DISTINCT FROM ARRAY(
    SELECT input.id
    FROM pg_catalog.unnest(p_expected_ids) WITH ORDINALITY AS input(id, position)
    ORDER BY input.position
  ) THEN
    RAISE EXCEPTION 'A programação mudou. Recarregue a ordem antes de salvar.'
      USING ERRCODE = '40001';
  END IF;

  UPDATE public.tv_videos AS video
  SET sort_order = input.position::integer
  FROM pg_catalog.unnest(p_ordered_ids) WITH ORDINALITY AS input(id, position)
  WHERE video.id = input.id AND video.archived_at IS NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count <> v_ordered_count THEN
    RAISE EXCEPTION 'Não foi possível salvar a programação completa.'
      USING ERRCODE = '42501';
  END IF;
END;
$function$;

-- Supabase default grants may include anon/service_role on newly created functions.
REVOKE ALL ON FUNCTION public.reorder_tv_videos(uuid[], uuid[])
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.reorder_tv_videos(uuid[], uuid[])
  TO authenticated;

-- Realtime is an additional update signal; public SELECT still follows the same RLS.
DO $publication$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tv_videos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tv_videos;
  END IF;
END;
$publication$;
