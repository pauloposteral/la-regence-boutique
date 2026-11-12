-- Rollback-only authorization verification for the TV screen heartbeat (Task 2).
-- One DO block; it always ends with RAISE EXCEPTION, so every write is rolled back.
-- Requires a session allowed to SET ROLE anon/authenticated (the project owner).
-- Output: the exception message "TV_AUTH_RESULT passed=N failed=M | ...".
DO $$
DECLARE
  admin_id uuid := (SELECT user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1);
  nonadmin_id uuid := extensions.gen_random_uuid();
  vid uuid := (SELECT id FROM public.tv_videos ORDER BY sort_order, id LIMIT 1);
  a_dev uuid; a_tok text; b_dev uuid; b_tok text; new_tok text;
  res text[] := '{}'; passed int := 0; failed int := 0;
  ok boolean; n int; c bigint;
  rec public.tv_screens%ROWTYPE;
BEGIN
  IF admin_id IS NULL OR vid IS NULL THEN RAISE EXCEPTION 'fixtures missing'; END IF;

  -- helper macro pattern: append PASS/FAIL
  -- ACL facts
  ok := NOT has_function_privilege('anon', 'public.tv_pair_screen(text)', 'EXECUTE')
    AND NOT has_function_privilege('anon', 'public.tv_revoke_screen(uuid)', 'EXECUTE')
    AND NOT has_function_privilege('anon', 'public.tv_rotate_screen(uuid)', 'EXECUTE');
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' acl:anon-no-pair/revoke/rotate');
  ok := NOT has_function_privilege('anon', 'public.tv_require_admin()', 'EXECUTE') AND NOT has_function_privilege('authenticated', 'public.tv_require_admin()', 'EXECUTE');
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' acl:no-direct-require_admin');
  ok := has_function_privilege('anon', 'public.tv_report_screen(uuid,text,text,uuid,uuid,double precision,integer,integer,text,text,integer,integer,bigint,integer)', 'EXECUTE');
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' acl:anon-may-report');
  ok := NOT EXISTS (SELECT 1 FROM pg_proc p, aclexplode(p.proacl) x WHERE p.pronamespace = 'public'::regnamespace AND p.proname LIKE 'tv\_%' AND p.proname <> 'reorder_tv_videos' AND x.grantee = 0);
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' acl:no-PUBLIC-execute');
  ok := NOT has_schema_privilege('anon', 'private', 'USAGE') AND NOT has_schema_privilege('authenticated', 'private', 'USAGE');
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' acl:private-schema-closed');
  ok := NOT has_table_privilege('anon', 'public.tv_screens', 'SELECT,INSERT,UPDATE,DELETE') AND NOT has_table_privilege('authenticated', 'public.tv_screens', 'INSERT,UPDATE,DELETE');
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' acl:no-table-DML');
  ok := (SELECT bool_and(p.prosecdef AND p.proconfig @> ARRAY['search_path=""']) FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname IN ('tv_pair_screen','tv_revoke_screen','tv_rotate_screen','tv_report_screen','tv_require_admin'));
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' acl:definer-empty-search_path');

  -- Admin pairs two devices
  PERFORM set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT p.device_id, p.token INTO a_dev, a_tok FROM public.tv_pair_screen('TV teste A') p;
  SELECT p.device_id, p.token INTO b_dev, b_tok FROM public.tv_pair_screen('TV teste B') p;
  ok := a_tok ~ '^[0-9a-f]{64}$' AND b_tok ~ '^[0-9a-f]{64}$' AND a_tok <> b_tok;
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' admin-pairs-64hex');
  SELECT count(*) INTO c FROM public.tv_screens WHERE device_id IN (a_dev, b_dev);
  res := res || (CASE WHEN c = 2 THEN 'PASS' ELSE 'FAIL' END || ' admin-reads-screens');
  BEGIN PERFORM public.tv_pair_screen(repeat('x', 65)); ok := false; EXCEPTION WHEN invalid_parameter_value THEN ok := true; END;
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' label>64-rejected');
  EXECUTE 'RESET ROLE';

  -- Non-admin authenticated
  PERFORM set_config('request.jwt.claims', json_build_object('sub', nonadmin_id, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO c FROM public.tv_screens;
  res := res || (CASE WHEN c = 0 THEN 'PASS' ELSE 'FAIL' END || ' nonadmin-reads-zero');
  BEGIN PERFORM public.tv_pair_screen('x'); ok := false; EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' nonadmin-cannot-pair');
  BEGIN PERFORM public.tv_revoke_screen(a_dev); ok := false; EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' nonadmin-cannot-revoke');
  BEGIN PERFORM public.tv_rotate_screen(a_dev); ok := false; EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' nonadmin-cannot-rotate');
  BEGIN UPDATE public.tv_screens SET label = 'x'; ok := false; EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' nonadmin-direct-update-denied');
  BEGIN PERFORM 1 FROM private.tv_screen_credentials; ok := false; EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' nonadmin-no-credentials');
  EXECUTE 'RESET ROLE';

  -- Anonymous
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  EXECUTE 'SET LOCAL ROLE anon';
  BEGIN PERFORM 1 FROM public.tv_screens; ok := false; EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' anon-cannot-read-screens');
  BEGIN INSERT INTO public.tv_screens(device_id, label) VALUES (gen_random_uuid(), 'x'); ok := false; EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' anon-direct-insert-denied');
  BEGIN PERFORM 1 FROM private.tv_screen_credentials; ok := false; EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' anon-no-credentials');
  BEGIN PERFORM public.tv_pair_screen('x'); ok := false; EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' anon-cannot-pair');
  ok := public.tv_report_screen(a_dev, a_tok, 'playing', vid, NULL, 12.5, 1920, 1080, 'normal', repeat('a', 64), 3, 17, 1000, 5);
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' anon-valid-token-A-accepted');
  BEGIN PERFORM public.tv_report_screen(b_dev, a_tok, 'playing', NULL, NULL, 0, 0, 0, 'normal', NULL, 0, 0, 0, NULL); ok := false;
  EXCEPTION WHEN invalid_authorization_specification THEN ok := SQLERRM = 'Credencial de tela inválida.'; END;
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' token-A-cannot-report-B');
  BEGIN PERFORM public.tv_report_screen(gen_random_uuid(), a_tok, 'playing', NULL, NULL, 0, 0, 0, 'normal', NULL, 0, 0, 0, NULL); ok := false;
  EXCEPTION WHEN invalid_authorization_specification THEN ok := SQLERRM = 'Credencial de tela inválida.'; END;
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' unknown-device-generic-failure');
  n := 0;
  BEGIN PERFORM public.tv_report_screen(a_dev, a_tok, 'dancing', NULL, NULL, 0, 0, 0, 'normal', NULL, 0, 0, 0, NULL); EXCEPTION WHEN invalid_parameter_value THEN n := n + 1; END;
  BEGIN PERFORM public.tv_report_screen(a_dev, a_tok, 'playing', NULL, NULL, 'NaN', 0, 0, 'normal', NULL, 0, 0, 0, NULL); EXCEPTION WHEN invalid_parameter_value THEN n := n + 1; END;
  BEGIN PERFORM public.tv_report_screen(a_dev, a_tok, 'playing', NULL, NULL, 'Infinity', 0, 0, 'normal', NULL, 0, 0, 0, NULL); EXCEPTION WHEN invalid_parameter_value THEN n := n + 1; END;
  BEGIN PERFORM public.tv_report_screen(a_dev, a_tok, 'playing', NULL, NULL, -1, 0, 0, 'normal', NULL, 0, 0, 0, NULL); EXCEPTION WHEN invalid_parameter_value THEN n := n + 1; END;
  BEGIN PERFORM public.tv_report_screen(a_dev, a_tok, 'playing', NULL, NULL, 0, 8193, 0, 'normal', NULL, 0, 0, 0, NULL); EXCEPTION WHEN invalid_parameter_value THEN n := n + 1; END;
  BEGIN PERFORM public.tv_report_screen(a_dev, a_tok, 'playing', NULL, NULL, 0, 0, 0, 'turbo', NULL, 0, 0, 0, NULL); EXCEPTION WHEN invalid_parameter_value THEN n := n + 1; END;
  BEGIN PERFORM public.tv_report_screen(a_dev, a_tok, 'playing', NULL, NULL, 0, 0, 0, 'normal', repeat('a', 65), 0, 0, 0, NULL); EXCEPTION WHEN invalid_parameter_value THEN n := n + 1; END;
  BEGIN PERFORM public.tv_report_screen(a_dev, a_tok, 'playing', gen_random_uuid(), NULL, 0, 0, 0, 'normal', NULL, 0, 0, 0, NULL); EXCEPTION WHEN invalid_parameter_value THEN n := n + 1; END;
  BEGIN PERFORM public.tv_report_screen(a_dev, upper(a_tok), 'playing', NULL, NULL, 0, 0, 0, 'normal', NULL, 0, 0, 0, NULL); EXCEPTION WHEN invalid_parameter_value THEN n := n + 1; END;
  BEGIN PERFORM public.tv_report_screen(a_dev, a_tok, 'playing', NULL, NULL, 0, 0, 0, 'normal', NULL, 13, 0, 0, NULL); EXCEPTION WHEN invalid_parameter_value THEN n := n + 1; END;
  res := res || (CASE WHEN n = 10 THEN 'PASS' ELSE 'FAIL' END || ' ten-invalid-payloads-rejected(' || n || ')');
  -- throttle: immediate second accepted-looking report is refused and changes nothing
  ok := public.tv_report_screen(a_dev, a_tok, 'paused', vid, vid, 99, 1, 1, 'normal', NULL, 0, 0, 0, NULL);
  res := res || (CASE WHEN ok = false THEN 'PASS' ELSE 'FAIL' END || ' throttled-within-5s');
  EXECUTE 'RESET ROLE';
  SELECT * INTO rec FROM public.tv_screens WHERE device_id = a_dev;
  ok := rec.position_seconds = 12.5 AND rec.width = 1920 AND rec.last_completed_item IS NULL AND rec.last_seen_at = now();
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' invalid+throttled-did-not-mutate');
  SELECT * INTO rec FROM public.tv_screens WHERE device_id = b_dev;
  res := res || (CASE WHEN rec.last_seen_at IS NULL THEN 'PASS' ELSE 'FAIL' END || ' B-untouched');

  -- Stagnant position must not advance last_progress; server owns timestamps.
  UPDATE public.tv_screens SET last_seen_at = now() - interval '10 seconds', last_progress_at = now() - interval '10 seconds' WHERE device_id = a_dev;
  EXECUTE 'SET LOCAL ROLE anon';
  PERFORM public.tv_report_screen(a_dev, a_tok, 'paused', vid, NULL, 12.5, 1920, 1080, 'normal', NULL, 0, 0, 0, NULL);
  EXECUTE 'RESET ROLE';
  SELECT * INTO rec FROM public.tv_screens WHERE device_id = a_dev;
  ok := rec.last_progress_at < now() - interval '9 seconds' AND rec.last_seen_at = now() AND rec.playback_state = 'paused';
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' stagnant-position-no-progress');
  UPDATE public.tv_screens SET last_seen_at = now() - interval '10 seconds' WHERE device_id = a_dev;
  EXECUTE 'SET LOCAL ROLE anon';
  PERFORM public.tv_report_screen(a_dev, a_tok, 'playing', vid, vid, 13.5, 1920, 1080, 'normal', NULL, 0, 0, 0, NULL);
  EXECUTE 'RESET ROLE';
  SELECT * INTO rec FROM public.tv_screens WHERE device_id = a_dev;
  ok := rec.last_progress_at = now() AND rec.last_completed_item = vid;
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' advancing-position-progress+completion');

  -- Rotation and revocation
  PERFORM set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT p.token INTO new_tok FROM public.tv_rotate_screen(a_dev) p;
  ok := public.tv_revoke_screen(b_dev);
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' admin-revokes-B');
  ok := public.tv_revoke_screen(b_dev) = false;
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' revoke-idempotent-false');
  EXECUTE 'RESET ROLE';
  UPDATE public.tv_screens SET last_seen_at = now() - interval '1 minute' WHERE device_id IN (a_dev, b_dev);
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  EXECUTE 'SET LOCAL ROLE anon';
  BEGIN PERFORM public.tv_report_screen(a_dev, a_tok, 'playing', NULL, NULL, 0, 0, 0, 'normal', NULL, 0, 0, 0, NULL); ok := false;
  EXCEPTION WHEN invalid_authorization_specification THEN ok := true; END;
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' old-rotated-token-fails');
  ok := public.tv_report_screen(a_dev, new_tok, 'playing', NULL, NULL, 0, 0, 0, 'normal', NULL, 0, 0, 0, NULL);
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' new-rotated-token-works');
  BEGIN PERFORM public.tv_report_screen(b_dev, b_tok, 'playing', NULL, NULL, 0, 0, 0, 'normal', NULL, 0, 0, 0, NULL); ok := false;
  EXCEPTION WHEN invalid_authorization_specification THEN ok := SQLERRM = 'Credencial de tela inválida.'; END;
  res := res || (CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' revoked-token-generic-failure');
  EXECUTE 'RESET ROLE';

  SELECT count(*) FILTER (WHERE x LIKE 'PASS%'), count(*) FILTER (WHERE x LIKE 'FAIL%') INTO passed, failed FROM unnest(res) x;
  RAISE EXCEPTION 'TV_AUTH_RESULT passed=% failed=% | %', passed, failed, array_to_string(res, ' ; ');
END $$;
