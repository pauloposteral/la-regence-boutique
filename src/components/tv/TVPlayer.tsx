import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize, Minimize, Pause, Play, SkipForward, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { nextVideoId, playableVideos, videoSourceKey, type TVVideo } from "@/lib/tvPlaylist";

import CinematicStage, { type PlaybackHandle } from "./CinematicStage";

type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => void };

export default function TVPlayer({ videos, onRefresh, refreshing = false, initialId = null }: { videos: TVVideo[]; onRefresh?: () => void | Promise<void>; refreshing?: boolean; initialId?: string | null }) {
  const playlist = useMemo(() => playableVideos(videos), [videos]);
  const stage = useRef<HTMLDivElement>(null);
  const media = useRef<PlaybackHandle>(null);
  const lastProgress = useRef(Date.now());
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const [currentId, setCurrentId] = useState<string | null>(initialId);
  const seen = useRef(new Set<string>());
  const [failed, setFailed] = useState(new Set<string>());
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenHint, setFullscreenHint] = useState("");
  const [playback, setPlayback] = useState({seconds:0, duration:0});
  const [notice, setNotice] = useState("");
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const refreshProgramming = async () => {
    if (!onRefresh || refreshing || manualRefreshing) return;
    setManualRefreshing(true);
    setNotice("Atualizando a programação…");
    try {
      await onRefresh();
      setFailed(new Set());
      setNotice("Programação atualizada.");
    } catch {
      setNotice("Não foi possível atualizar. Confira a conexão e tente novamente.");
    } finally { setManualRefreshing(false); }
  };
  const playlistKey = playlist.map(v => `${v.id}:${v.url}`).join("|");
  useEffect(() => { setFailed(new Set()); }, [playlistKey]);
  const requested = videos.find(v => v.id === currentId && v.active && !v.archived_at);
  const requestedKey = requested && videoSourceKey(requested);
  const retained = playlist.find(v => !failed.has(v.id) && (v.id === currentId || videoSourceKey(v) === requestedKey));
  const current = retained
    ?? playlist.find(v => !failed.has(v.id) && !seen.current.has(videoSourceKey(v)))
    ?? playlist.find(v => !failed.has(v.id));
  const currentUrl = current?.url;
  const selectedId = current?.id;
  const selectedKey = current && videoSourceKey(current);
  const retainedId = retained?.id;
  useEffect(() => {
    if (!selectedId || !selectedKey) return;
    if (!retainedId && seen.current.has(selectedKey)) seen.current.clear();
    seen.current.add(selectedKey);
    // Retain the first selection across background refreshes and insertions.
    setCurrentId(selectedId);
  }, [selectedId, selectedKey, retainedId]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 4500);
  }, []);

  const play = useCallback(() => {
    media.current?.play();
  }, []);

  const advance = useCallback((broken = false) => {
    if (broken && media.current?.recover?.()) { lastProgress.current = Date.now(); setNotice("Usando a versão compatível deste vídeo."); return; }
    const excluded = new Set(failed);
    if (broken && current) excluded.add(current.id);
    if (broken) { setFailed(excluded); setNotice("Um vídeo não respondeu. Seguindo a programação."); } else setNotice("");
    const next = nextVideoId(playlist, current?.id ?? null, excluded, seen.current);
    const nextVideo = playlist.find(video => video.id === next);
    if (nextVideo) {
      const key = videoSourceKey(nextVideo);
      // All usable sources have had a turn: start another cycle.
      if (seen.current.has(key)) seen.current.clear();
      seen.current.add(key);
    }
    setCurrentId(next);
    if (next && next === current?.id && media.current) {
      media.current.restart();
    }
    lastProgress.current = Date.now();
  }, [current, failed, playlist]);

  useEffect(() => {
    lastProgress.current = Date.now();
    setBlocked(false);
    setPlayback({seconds:0,duration:0});
  }, [currentUrl, selectedId]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (current && !paused && !blocked && Date.now() - lastProgress.current > 30_000) advance(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [advance, current, paused, blocked]);

  useEffect(() => {
    if (current || !playlist.length) return;
    const timer = setTimeout(() => { setFailed(new Set()); setCurrentId(null); }, 30_000);
    return () => clearTimeout(timer);
  }, [current, playlist.length]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    stage.current?.focus();
    showControls();
    const update = () => setFullscreen(Boolean(document.fullscreenElement ||
      (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement));
    document.addEventListener("fullscreenchange", update);
    document.addEventListener("webkitfullscreenchange", update);
    return () => {
      document.body.style.overflow = previous;
      clearTimeout(hideTimer.current);
      document.removeEventListener("fullscreenchange", update);
      document.removeEventListener("webkitfullscreenchange", update);
    };
  }, [showControls]);

  // Best-effort screen wake lock, reacquired after switching back to the TV tab.
  useEffect(() => {
    let lock: WakeLockSentinel | undefined;
    let cancelled = false;
    const acquire = async () => {
      if (document.visibilityState !== "visible" || !("wakeLock" in navigator) || lock && !lock.released) return;
      try {
        const acquired = await navigator.wakeLock.request("screen");
        if (cancelled) await acquired.release(); else lock = acquired;
      } catch { /* Older TVs and power-saving mode may deny wake locks. */ }
    };
    void acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => { cancelled = true; void lock?.release(); document.removeEventListener("visibilitychange", acquire); };
  }, []);

  const toggleFullscreen = async () => {
    setFullscreenHint("");
    try {
      if (document.fullscreenElement) { await document.exitFullscreen(); return; }
      const element = stage.current as WebkitElement | null;
      if (element?.requestFullscreen) await element.requestFullscreen({ navigationUI: "hide" });
      else if (element?.webkitRequestFullscreen) element.webkitRequestFullscreen();
      else { setFullscreenHint("Use o modo tela cheia do navegador da TV."); return; }
      const orientation = screen.orientation as ScreenOrientation & { lock?: (mode: string) => Promise<void> };
      void orientation?.lock?.("landscape").catch(() => {});
    } catch { setFullscreenHint("Use o botão de tela cheia do navegador da TV."); }
    play();
  };

  const togglePause = () => {
    lastProgress.current = Date.now();
    setPaused(value => !value);
  };

  const buttonClass = "rounded-full border border-white/25 bg-brown-deep/85 p-3 text-white hover:bg-gold focus-visible:ring-2 focus-visible:ring-gold transition-colors";

  return (
    <div ref={stage} tabIndex={0} aria-label="TV La Régence" className={`fixed inset-0 z-[150] h-[100dvh] w-screen overflow-hidden bg-brown-deep text-white outline-none ${controlsVisible || blocked ? "" : "cursor-none"}`}
      onMouseMove={showControls} onPointerDown={showControls} onFocus={showControls}
      onKeyDown={event => {
        showControls();
        if (event.target !== stage.current) return;
        if (event.key === "Enter" || event.key.toLowerCase() === "f") { event.preventDefault(); void toggleFullscreen(); }
        if (event.key === " ") { event.preventDefault(); togglePause(); }
        if (event.key === "ArrowRight") { event.preventDefault(); advance(); }
        if (event.key.toLowerCase() === "m") setMuted(value => !value);
      }}>
      {current ? (
        <CinematicStage ref={media} video={current} paused={paused} muted={muted}
          onPaused={() => setPaused(true)} onReady={() => { setPaused(false); setBlocked(false); lastProgress.current = Date.now(); }}
          onBlocked={() => setBlocked(true)} onEnded={() => advance()} onError={() => advance(true)}
          onProgress={(seconds = 0, duration = 0) => { lastProgress.current = Date.now(); setPlayback({seconds,duration}); }} />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
          <img src="/favicon.jpeg" alt="" className="h-24 w-24 rounded-full border border-gold/50 object-cover" />
          <p className="font-display text-4xl lg:text-6xl">La Régence</p>
          <p className="text-gold-light text-lg" role="status">{playlist.length ? "Tentando retomar a programação…" : "Nenhum vídeo ativo na programação."}</p>
          <p className="text-white/60">{playlist.length ? "A reprodução será retomada automaticamente." : "Adicione vídeos em cafelaregence.com.br/video/enviar"}</p>
        </div>
      )}
      {blocked && <div className="absolute inset-0 flex items-center justify-center bg-brown-deep/60">
        <button className="rounded-full bg-gold px-8 py-5 text-lg text-white" onClick={() => { play(); setPaused(false); }} aria-label="Iniciar reprodução"><Play className="mr-3 inline h-6 w-6" />Iniciar reprodução</button>
      </div>}
      {playback.duration > 0 && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/10" aria-hidden="true"><div className="h-full bg-gold" style={{width:`${Math.min(100, playback.seconds / playback.duration * 100)}%`}} /></div>}
      <div className={`absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-3 bg-gradient-to-t from-brown-deep/95 to-transparent p-5 pt-16 transition-opacity duration-300 ${controlsVisible || paused || blocked ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="mr-auto min-w-0"><p className="text-[10px] uppercase tracking-[.3em] text-gold-light">La Régence · TV</p><p className="mt-1 truncate text-sm text-white/80">{current?.title ?? "Programação"}</p><p className="mt-1 text-xs text-white/60">{current ? `${playlist.findIndex(v => v.id === current.id) + 1} de ${playlist.length} · ${paused ? "Pausado" : blocked ? "Aguardando início" : "Sequência automática"}` : ""}{playback.duration > 0 ? ` · ${Math.floor(playback.seconds)} / ${Math.ceil(playback.duration)} s` : ""}</p></div>
        {current && <>
          <button className={buttonClass} onClick={togglePause} aria-label={paused ? "Reproduzir" : "Pausar"}>{paused ? <Play /> : <Pause />}</button>
          <button className={buttonClass} onClick={() => advance()} aria-label="Próximo vídeo"><SkipForward /></button>
          <button className={buttonClass} onClick={() => setMuted(value => !value)} aria-label={muted ? "Ativar som" : "Silenciar"}>{muted ? <VolumeX /> : <Volume2 />}</button>
        </>}
        {onRefresh && <button className={buttonClass} disabled={refreshing || manualRefreshing} onClick={() => void refreshProgramming()} aria-label="Atualizar programação"><RotateCcw className={refreshing || manualRefreshing ? "animate-spin" : ""} /></button>}
        <button className={buttonClass} onClick={() => void toggleFullscreen()} aria-label={fullscreen ? "Sair da tela cheia" : "Tela cheia"}>{fullscreen ? <Minimize /> : <Maximize />}</button>
        {notice && <p className="w-full text-sm text-white/70" role="status">{notice}</p>}
        {fullscreenHint && <p className="w-full text-right text-sm" role="status">{fullscreenHint}</p>}
      </div>
    </div>
  );
}
