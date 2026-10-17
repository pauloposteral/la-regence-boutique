-- Run after the migration as the migration owner, using a client that stops on error.
-- All media rows, order changes, role changes and JWT test claims are rolled back.
-- No auth.users/user_roles rows or Storage objects are created or changed.
-- An existing admin is selected internally; no account IDs are returned or printed.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '20s';

CREATE TEMP TABLE tv_order_sync_context (
  admin_id uuid NOT NULL,
  non_admin_id uuid NOT NULL DEFAULT gen_random_uuid(),
  active_id uuid NOT NULL DEFAULT gen_random_uuid(),
  paused_id uuid NOT NULL DEFAULT gen_random_uuid(),
  archived_id uuid NOT NULL DEFAULT gen_random_uuid(),
  upload_id uuid NOT NULL DEFAULT gen_random_uuid(),
  expected_ids uuid[]
) ON COMMIT DROP;

DO $setup$
DECLARE
  v_admin_id uuid;
BEGIN
  SELECT user_id INTO v_admin_id
  FROM public.user_roles
  WHERE role = 'admin'::public.app_role
  ORDER BY id
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'This test requires an existing admin; no authentication data was changed.';
  END IF;

  INSERT INTO pg_temp.tv_order_sync_context (admin_id) VALUES (v_admin_id);

  IF public.has_role(
    (SELECT non_admin_id FROM pg_temp.tv_order_sync_context),
    'admin'::public.app_role
  ) THEN
    RAISE EXCEPTION 'The temporary non-admin subject unexpectedly has the admin role.';
  END IF;

  IF NOT pg_catalog.has_function_privilege(
    'authenticated', 'public.reorder_tv_videos(uuid[],uuid[])', 'EXECUTE'
  ) OR pg_catalog.has_function_privilege(
    'anon', 'public.reorder_tv_videos(uuid[],uuid[])', 'EXECUTE'
  ) OR pg_catalog.has_function_privilege(
    'service_role', 'public.reorder_tv_videos(uuid[],uuid[])', 'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'The ordering function has unexpected EXECUTE grants.';
  END IF;

  IF NOT pg_catalog.has_table_privilege('authenticated', 'public.tv_videos', 'UPDATE') THEN
    RAISE EXCEPTION 'The invoker needs the existing table UPDATE grant to acquire its lock.';
  END IF;

  IF (SELECT prosecdef FROM pg_catalog.pg_proc
      WHERE oid = 'public.reorder_tv_videos(uuid[],uuid[])'::regprocedure) THEN
    RAISE EXCEPTION 'The ordering function must remain SECURITY INVOKER.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'tv_videos'
  ) THEN
    RAISE EXCEPTION 'tv_videos is missing from the Realtime publication.';
  END IF;
END;
$setup$;

-- Include tied/gapped orders, a paused member, and an archived row that must not move.
INSERT INTO public.tv_videos (
  id, title, url, storage_path, sort_order, active, archived_at, fit,
  fallback_url, max_duration_seconds, source_url, credit, poster_url
)
SELECT fixture.id, fixture.title, fixture.url, 'test-only/no-storage-object.mp4',
  fixture.sort_order, fixture.active, fixture.archived_at, 'contain',
  'https://example.invalid/tv-order-test-fallback.mp4', 17,
  'https://example.invalid/tv-order-test-source', 'Transactional test only',
  'https://example.invalid/tv-order-test-poster.jpg'
FROM pg_temp.tv_order_sync_context AS context
CROSS JOIN LATERAL (VALUES
  (context.active_id, 'TV order test active', 'https://example.invalid/tv-order-test-active.mp4',
    999998, true, NULL::timestamptz),
  (context.paused_id, 'TV order test paused', 'https://example.invalid/tv-order-test-paused.mp4',
    999998, false, NULL::timestamptz),
  (context.archived_id, 'TV order test archived', 'https://example.invalid/tv-order-test-archived.mp4',
    999999, false, CURRENT_TIMESTAMP)
) AS fixture(id, title, url, sort_order, active, archived_at);

UPDATE pg_temp.tv_order_sync_context
SET expected_ids = (
  SELECT array_agg(id ORDER BY sort_order, id)
  FROM public.tv_videos WHERE archived_at IS NULL
);

CREATE TEMP TABLE tv_order_sync_before ON COMMIT DROP AS
SELECT id, sort_order, archived_at, to_jsonb(video) - 'sort_order' AS metadata
FROM public.tv_videos AS video;

-- GRANT does not resolve the pg_temp namespace alias; use this session's schema.
DO $temporary_schema_grant$
DECLARE
  v_schema name;
BEGIN
  SELECT nspname INTO v_schema
  FROM pg_catalog.pg_namespace
  WHERE oid = pg_catalog.pg_my_temp_schema();
  EXECUTE pg_catalog.format('GRANT USAGE ON SCHEMA %I TO authenticated', v_schema);
END;
$temporary_schema_grant$;
GRANT SELECT ON pg_temp.tv_order_sync_context, pg_temp.tv_order_sync_before TO authenticated;

DO $anonymous_claims$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claims', '{}', true);
END;
$anonymous_claims$;
SET LOCAL ROLE anon;
DO $anonymous_permission$
BEGIN
  BEGIN
    PERFORM public.reorder_tv_videos(ARRAY[]::uuid[], ARRAY[]::uuid[]);
    RAISE EXCEPTION 'Anonymous execution unexpectedly succeeded.';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END;
$anonymous_permission$;
RESET ROLE;

DO $non_admin_claims$
DECLARE
  v_subject uuid := (SELECT non_admin_id FROM pg_temp.tv_order_sync_context);
BEGIN
  PERFORM set_config('request.jwt.claim.sub', v_subject::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_subject, 'role', 'authenticated'
  )::text, true);
END;
$non_admin_claims$;
SET LOCAL ROLE authenticated;
DO $non_admin_permission$
DECLARE
  v_expected uuid[] := (SELECT expected_ids FROM pg_temp.tv_order_sync_context);
BEGIN
  IF current_user <> 'authenticated' THEN
    RAISE EXCEPTION 'The permission check is not running as authenticated.';
  END IF;

  BEGIN
    PERFORM public.reorder_tv_videos(v_expected, v_expected);
    RAISE EXCEPTION 'A non-admin unexpectedly changed the order.';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  -- A logged-in database role with no JWT subject must also be refused.
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claims', '{"role":"authenticated"}', true);
  BEGIN
    PERFORM public.reorder_tv_videos(v_expected, v_expected);
    RAISE EXCEPTION 'A missing JWT subject unexpectedly changed the order.';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_locks
    WHERE pid = pg_catalog.pg_backend_pid()
      AND relation = 'public.tv_videos'::regclass
      AND mode = 'ShareRowExclusiveLock' AND granted
  ) THEN
    RAISE EXCEPTION 'An unauthorized call retained the programming lock.';
  END IF;
END;
$non_admin_permission$;
RESET ROLE;

DO $admin_claims$
DECLARE
  v_subject uuid := (SELECT admin_id FROM pg_temp.tv_order_sync_context);
BEGIN
  PERFORM set_config('request.jwt.claim.sub', v_subject::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_subject, 'role', 'authenticated'
  )::text, true);
END;
$admin_claims$;
SET LOCAL ROLE authenticated;
DO $ordering_contract$
DECLARE
  v_context record;
  v_case record;
  v_expected uuid[];
  v_reordered uuid[];
  v_before jsonb;
BEGIN
  SELECT * INTO v_context FROM pg_temp.tv_order_sync_context;
  v_expected := v_context.expected_ids;
  SELECT array_agg(input.id ORDER BY input.position DESC)
  INTO v_reordered
  FROM unnest(v_expected) WITH ORDINALITY AS input(id, position);

  IF current_user <> 'authenticated' OR auth.uid() IS DISTINCT FROM v_context.admin_id THEN
    RAISE EXCEPTION 'The success checks must run as the authenticated admin invoker.';
  END IF;

  -- Compare every column after each refusal to detect any partial writes.
  SELECT jsonb_agg(to_jsonb(video) ORDER BY video.id) INTO v_before
  FROM public.tv_videos AS video;

  FOR v_case IN
    SELECT * FROM (VALUES
      ('null proposed list', NULL::uuid[], v_expected, '22023'),
      ('null expected list', v_expected, NULL::uuid[], '22023'),
      ('null proposed member', array_append(v_expected, NULL::uuid), v_expected, '22023'),
      ('null expected member', v_expected, array_append(v_expected, NULL::uuid), '22023'),
      ('duplicate proposed member', array_append(v_expected, v_expected[1]), v_expected, '22023'),
      ('duplicate expected member', v_expected, array_append(v_expected, v_expected[1]), '22023'),
      ('omitted paused member', array_remove(v_expected, v_context.paused_id), v_expected, '22023'),
      ('archived proposed member', array_replace(v_expected, v_expected[1], v_context.archived_id), v_expected, '22023'),
      ('unknown proposed member', array_replace(v_expected, v_expected[1], v_context.upload_id), v_expected, '22023'),
      ('multidimensional input', ARRAY[[v_expected[1]], [v_expected[2]]], v_expected, '22023'),
      ('stale expected order', v_expected, v_reordered, '40001'),
      ('stale empty snapshot', ARRAY[]::uuid[], ARRAY[]::uuid[], '40001')
    ) AS cases(label, ordered_ids, expected_ids, expected_state)
  LOOP
    BEGIN
      PERFORM public.reorder_tv_videos(v_case.ordered_ids, v_case.expected_ids);
      RAISE EXCEPTION 'Case % unexpectedly succeeded.', v_case.label;
    EXCEPTION WHEN OTHERS THEN
      IF SQLSTATE <> v_case.expected_state THEN
        RAISE EXCEPTION 'Case %: expected SQLSTATE %, received %.',
          v_case.label, v_case.expected_state, SQLSTATE;
      END IF;
    END;

    IF (SELECT jsonb_agg(to_jsonb(video) ORDER BY video.id)
        FROM public.tv_videos AS video) IS DISTINCT FROM v_before THEN
      RAISE EXCEPTION 'Case % left a partial write.', v_case.label;
    END IF;
  END LOOP;

  PERFORM public.reorder_tv_videos(v_reordered, v_expected);

  IF EXISTS (
    SELECT 1
    FROM unnest(v_reordered) WITH ORDINALITY AS input(id, position)
    LEFT JOIN public.tv_videos AS video ON video.id = input.id
    WHERE video.id IS NULL OR video.sort_order <> input.position
      OR video.archived_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'The complete order was not saved as positions 1 through N.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_temp.tv_order_sync_before AS before
    LEFT JOIN public.tv_videos AS video ON video.id = before.id
    WHERE video.id IS NULL
      OR (to_jsonb(video) - 'sort_order') IS DISTINCT FROM before.metadata
      OR (before.archived_at IS NOT NULL AND video.sort_order <> before.sort_order)
  ) THEN
    RAISE EXCEPTION 'Reordering changed metadata or an archived position.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_locks
    WHERE pid = pg_catalog.pg_backend_pid()
      AND relation = 'public.tv_videos'::regclass
      AND mode = 'ShareRowExclusiveLock' AND granted
  ) THEN
    RAISE EXCEPTION 'The authenticated invoker did not acquire the expected lock.';
  END IF;

  SELECT jsonb_agg(to_jsonb(video) ORDER BY video.id) INTO v_before
  FROM public.tv_videos AS video;
  BEGIN
    PERFORM public.reorder_tv_videos(v_expected, v_expected);
    RAISE EXCEPTION 'A snapshot preceding another reorder unexpectedly succeeded.';
  EXCEPTION WHEN serialization_failure THEN
    NULL;
  END;
  IF (SELECT jsonb_agg(to_jsonb(video) ORDER BY video.id)
      FROM public.tv_videos AS video) IS DISTINCT FROM v_before THEN
    RAISE EXCEPTION 'A stale order left a partial write.';
  END IF;

  -- Model a newly committed upload becoming visible before a stale request arrives.
  INSERT INTO public.tv_videos (id, title, url, sort_order, active)
  VALUES (v_context.upload_id, 'TV order test new upload',
    'https://example.invalid/tv-order-test-upload.mp4', 999999, true);
  SELECT jsonb_agg(to_jsonb(video) ORDER BY video.id) INTO v_before
  FROM public.tv_videos AS video;
  BEGIN
    PERFORM public.reorder_tv_videos(v_reordered, v_reordered);
    RAISE EXCEPTION 'A snapshot preceding an upload unexpectedly succeeded.';
  EXCEPTION WHEN serialization_failure THEN
    NULL;
  END;
  IF (SELECT jsonb_agg(to_jsonb(video) ORDER BY video.id)
      FROM public.tv_videos AS video) IS DISTINCT FROM v_before THEN
    RAISE EXCEPTION 'A stale upload snapshot left a partial write.';
  END IF;

  SELECT array_agg(id ORDER BY sort_order, id) INTO v_expected
  FROM public.tv_videos WHERE archived_at IS NULL;
  PERFORM public.reorder_tv_videos(v_expected, v_expected);

  -- Archive only a disposable fixture; an older full list must now conflict.
  UPDATE public.tv_videos SET active = false, archived_at = CURRENT_TIMESTAMP
  WHERE id = v_context.active_id;
  SELECT jsonb_agg(to_jsonb(video) ORDER BY video.id) INTO v_before
  FROM public.tv_videos AS video;
  BEGIN
    PERFORM public.reorder_tv_videos(v_expected, v_expected);
    RAISE EXCEPTION 'A snapshot preceding archival unexpectedly succeeded.';
  EXCEPTION WHEN serialization_failure THEN
    NULL;
  END;
  IF (SELECT jsonb_agg(to_jsonb(video) ORDER BY video.id)
      FROM public.tv_videos AS video) IS DISTINCT FROM v_before THEN
    RAISE EXCEPTION 'A stale archive snapshot left a partial write.';
  END IF;
END;
$ordering_contract$;
RESET ROLE;

SELECT 'TV ordering assertions passed; the transaction is rolled back next.' AS result;
ROLLBACK;
