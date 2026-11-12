-- Task 2: secure paired-screen heartbeat. Additive; tv_videos untouched.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;

CREATE TABLE private.tv_screen_credentials (
  device_id uuid PRIMARY KEY,
  token_hash bytea NOT NULL CHECK (octet_length(token_hash) = 32),
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);
REVOKE ALL ON private.tv_screen_credentials FROM PUBLIC;
REVOKE ALL ON private.tv_screen_credentials FROM anon, authenticated;

CREATE TABLE public.tv_screens (
  device_id uuid PRIMARY KEY,
  label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 64 AND btrim(label) <> ''),
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  last_seen_at timestamptz,
  last_progress_at timestamptz,
  current_item uuid,
  last_completed_item uuid,
  playback_state text CHECK (playback_state IN ('playing','paused','buffering','blocked','error','offline')),
  position_seconds double precision CHECK (position_seconds >= 0 AND position_seconds <= 86400),
  width integer CHECK (width BETWEEN 0 AND 8192),
  height integer CHECK (height BETWEEN 0 AND 8192),
  quality_mode text CHECK (quality_mode IN ('normal','compatible','reduced-motion')),
  playlist_revision text CHECK (playlist_revision ~ '^[0-9a-f]{64}$'),
  cached_count integer CHECK (cached_count BETWEEN 0 AND 12),
  eligible_count integer CHECK (eligible_count BETWEEN 0 AND 100),
  cached_bytes bigint CHECK (cached_bytes BETWEEN 0 AND 201326592),
  snapshot_age_seconds integer CHECK (snapshot_age_seconds BETWEEN 0 AND 315360000)
);
COMMENT ON TABLE public.tv_screens IS 'Admin-readable browser heartbeat of paired TV screens. Not proof that a physical TV is powered on. Written only by tv_report_screen.';
REVOKE ALL ON public.tv_screens FROM PUBLIC;
REVOKE ALL ON public.tv_screens FROM anon, authenticated;
GRANT SELECT ON public.tv_screens TO authenticated;
GRANT ALL ON public.tv_screens TO service_role;
ALTER TABLE public.tv_screens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read TV screens" ON public.tv_screens FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE FUNCTION public.tv_require_admin() RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false) THEN
    RAISE EXCEPTION 'Somente administradores podem gerenciar telas.' USING ERRCODE = '42501';
  END IF;
END $$;

CREATE FUNCTION public.tv_pair_screen(p_label text)
RETURNS TABLE(device_id uuid, token text)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_label text := pg_catalog.btrim(p_label);
  v_device uuid := extensions.gen_random_uuid();
  v_secret bytea := extensions.gen_random_bytes(32);
BEGIN
  PERFORM public.tv_require_admin();
  IF v_label IS NULL OR pg_catalog.char_length(v_label) < 1 OR pg_catalog.char_length(v_label) > 64 THEN
    RAISE EXCEPTION 'Informe um nome de tela com 1 a 64 caracteres.' USING ERRCODE = '22023';
  END IF;
  -- Serialize pairing so the 50-device ceiling cannot be raced.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('public.tv_pair_screen'));
  IF (SELECT pg_catalog.count(*) FROM private.tv_screen_credentials c WHERE c.revoked_at IS NULL) >= 50 THEN
    RAISE EXCEPTION 'Limite de 50 telas pareadas atingido. Revogue uma tela antes de parear outra.' USING ERRCODE = '54000';
  END IF;
  INSERT INTO private.tv_screen_credentials(device_id, token_hash) VALUES (v_device, pg_catalog.sha256(v_secret));
  INSERT INTO public.tv_screens(device_id, label) VALUES (v_device, v_label);
  RETURN QUERY SELECT v_device, pg_catalog.encode(v_secret, 'hex');
END $$;

CREATE FUNCTION public.tv_rotate_screen(p_device_id uuid)
RETURNS TABLE(device_id uuid, token text)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_secret bytea := extensions.gen_random_bytes(32);
BEGIN
  PERFORM public.tv_require_admin();
  UPDATE private.tv_screen_credentials c SET token_hash = pg_catalog.sha256(v_secret)
   WHERE c.device_id = p_device_id AND c.revoked_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tela não encontrada ou revogada.' USING ERRCODE = 'P0002'; END IF;
  RETURN QUERY SELECT p_device_id, pg_catalog.encode(v_secret, 'hex');
END $$;

CREATE FUNCTION public.tv_revoke_screen(p_device_id uuid)
RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.tv_require_admin();
  -- The row lock serializes with tv_report_screen's FOR UPDATE read.
  UPDATE private.tv_screen_credentials c SET revoked_at = pg_catalog.now()
   WHERE c.device_id = p_device_id AND c.revoked_at IS NULL;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE public.tv_screens s SET revoked_at = pg_catalog.now() WHERE s.device_id = p_device_id;
  RETURN true;
END $$;

CREATE FUNCTION public.tv_report_screen(
  p_device_id uuid, p_token text, p_state text, p_current_item uuid, p_last_completed_item uuid,
  p_position_seconds double precision, p_width integer, p_height integer, p_quality_mode text,
  p_playlist_revision text, p_cached_count integer, p_eligible_count integer, p_cached_bytes bigint,
  p_snapshot_age_seconds integer)
RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_hash bytea;
  v_revoked timestamptz;
  v_old public.tv_screens%ROWTYPE;
BEGIN
  -- Typed validation first: nothing is read or written for malformed input.
  IF p_device_id IS NULL OR p_token IS NULL OR p_token !~ '^[0-9a-f]{64}$'
    OR p_state IS NULL OR p_state NOT IN ('playing','paused','buffering','blocked','error','offline')
    OR p_position_seconds IS NULL OR p_position_seconds = 'NaN'::double precision
    OR p_position_seconds < 0 OR p_position_seconds > 86400
    OR p_width IS NULL OR p_width NOT BETWEEN 0 AND 8192 OR p_height IS NULL OR p_height NOT BETWEEN 0 AND 8192
    OR p_quality_mode IS NULL OR p_quality_mode NOT IN ('normal','compatible','reduced-motion')
    OR (p_playlist_revision IS NOT NULL AND p_playlist_revision !~ '^[0-9a-f]{64}$')
    OR p_cached_count IS NULL OR p_cached_count NOT BETWEEN 0 AND 12
    OR p_eligible_count IS NULL OR p_eligible_count NOT BETWEEN 0 AND 100
    OR p_cached_bytes IS NULL OR p_cached_bytes NOT BETWEEN 0 AND 201326592
    OR (p_snapshot_age_seconds IS NOT NULL AND p_snapshot_age_seconds NOT BETWEEN 0 AND 315360000) THEN
    RAISE EXCEPTION 'Relatório de tela inválido.' USING ERRCODE = '22023';
  END IF;
  -- Lock this device's credential: revoke/rotate wait for (or block) this report.
  SELECT c.token_hash, c.revoked_at INTO v_hash, v_revoked
    FROM private.tv_screen_credentials c WHERE c.device_id = p_device_id FOR UPDATE;
  IF v_hash IS NULL OR v_revoked IS NOT NULL OR v_hash <> pg_catalog.sha256(pg_catalog.decode(p_token, 'hex')) THEN
    RAISE EXCEPTION 'Credencial de tela inválida.' USING ERRCODE = '28000';
  END IF;
  IF (p_current_item IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.tv_videos v WHERE v.id = p_current_item))
    OR (p_last_completed_item IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.tv_videos v WHERE v.id = p_last_completed_item)) THEN
    RAISE EXCEPTION 'Relatório de tela inválido.' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_old FROM public.tv_screens s WHERE s.device_id = p_device_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Credencial de tela inválida.' USING ERRCODE = '28000'; END IF;
  -- Server-side throttle: at most one accepted update per device every 5 seconds.
  -- A throttled call changes nothing, including last_seen_at.
  IF v_old.last_seen_at IS NOT NULL AND v_old.last_seen_at > pg_catalog.now() - interval '5 seconds' THEN
    RETURN false;
  END IF;
  UPDATE public.tv_screens s SET
    last_seen_at = pg_catalog.now(),
    last_progress_at = CASE
      WHEN p_current_item IS NOT NULL AND (p_current_item IS DISTINCT FROM v_old.current_item
        OR p_position_seconds IS DISTINCT FROM v_old.position_seconds) THEN pg_catalog.now()
      ELSE v_old.last_progress_at END,
    current_item = p_current_item,
    last_completed_item = COALESCE(p_last_completed_item, v_old.last_completed_item),
    playback_state = p_state,
    position_seconds = p_position_seconds,
    width = p_width, height = p_height,
    quality_mode = p_quality_mode,
    playlist_revision = p_playlist_revision,
    cached_count = p_cached_count, eligible_count = p_eligible_count, cached_bytes = p_cached_bytes,
    snapshot_age_seconds = p_snapshot_age_seconds
  WHERE s.device_id = p_device_id;
  RETURN true;
END $$;

REVOKE ALL ON FUNCTION public.tv_require_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tv_pair_screen(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tv_rotate_screen(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tv_revoke_screen(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tv_report_screen(uuid, text, text, uuid, uuid, double precision, integer, integer, text, text, integer, integer, bigint, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tv_pair_screen(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tv_rotate_screen(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tv_revoke_screen(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tv_report_screen(uuid, text, text, uuid, uuid, double precision, integer, integer, text, text, integer, integer, bigint, integer) TO anon, authenticated;
