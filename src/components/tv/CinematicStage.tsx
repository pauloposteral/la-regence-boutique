import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from 'react';
import type { TVVideo } from '@/lib/tvPlaylist';
import { fileSourceUrl, playbackDuration, videoSourceKey } from '@/lib/tvPlaylist';
import { loadYouTubeAPI, type YouTubePlayer } from '@/lib/youtubePlayer';
import { createPressureTracker, PALETTES, resolveFit, resolvePairPresentation, type ResolvedPresentation } from '@/lib/tvPlaybackPolicy';
import './cinema.css';

export interface PlaybackHandle { play(): void; restart(): void; recover?(): boolean }
interface DeckProps {
  video: TVVideo; paused: boolean; muted: boolean; selected: boolean;
  onReady(): void; onPaused?(): void; onProgress(seconds?: number, duration?: number): void; onEnded(): void; onError(): void; onBlocked(): void;
  /** Measured decoder statistics and stalls of the selected deck (no estimates). */
  onSample?(dropped: number, total: number): void; onStall?(): void;
}
const PALETTE_RGB = Object.fromEntries(Object.entries(PALETTES).map(([name, value]) => [name, value.rgb])) as Record<string, string>;
const FileDeck = forwardRef<PlaybackHandle, DeckProps>(function FileDeck(props, ref) {
  const media = useRef<HTMLVideoElement>(null);
  // A source-keyed deck retains playback across catalog aliases. Preserve media
  // fragments in its initial URL; deduplication alone ignores the fragment.
  const [source, setSource] = useState(() => fileSourceUrl(props.video.url));
  const usedFallback = useRef(false);
  const callbacks = useRef(props); callbacks.current = props;
  const wasSelected = useRef(props.selected);
  // A prepared deck that has never been selected keeps its initial position
  // (e.g. a #t= fragment) on first promotion; later reselection restarts at 0.
  const everSelected = useRef(props.selected);
  const finished = useRef(false);
  const previousTime = useRef(-1);
  // Invalidates pending first-frame callbacks from a previous source/selection.
  const readyToken = useRef(0);
  const [prepared, setPrepared] = useState(false);
  const readyFrame = useRef<{ video: HTMLVideoElement; handle: number } | null>(null);
  const readyTimer = useRef<ReturnType<typeof setTimeout>>();
  // Ref-only helpers: stable identities, safe as effect dependencies.
  const cancelReady = useCallback(() => {
    readyToken.current++;
    clearTimeout(readyTimer.current); readyTimer.current = undefined;
    const frame = readyFrame.current; readyFrame.current = null;
    if (frame && typeof frame.video.cancelVideoFrameCallback === 'function') frame.video.cancelVideoFrameCallback(frame.handle);
  }, []);
  const reset = useCallback(() => { finished.current = false; previousTime.current = -1; cancelReady(); }, [cancelReady]);
  const announceReady = () => {
    const video = media.current;
    const state = callbacks.current;
    if (!video || !state.selected || state.paused) return;
    cancelReady();
    const token = readyToken.current;
    const fire = () => {
      if (readyToken.current !== token) return;
      cancelReady();
      if (callbacks.current.selected && !callbacks.current.paused) callbacks.current.onReady();
    };
    // Reveal on an actually presented frame where supported; `playing` is the
    // compatible fallback (and a short guard covers throttled hidden tabs).
    if (typeof video.requestVideoFrameCallback === 'function') {
      readyFrame.current = { video, handle: video.requestVideoFrameCallback(fire) };
      readyTimer.current = setTimeout(fire, 250);
    } else fire();
  };
  const finish = () => {
    if (!callbacks.current.selected || callbacks.current.paused || finished.current) return;
    finished.current = true; callbacks.current.onEnded();
  };
  const report = () => {
    const video = media.current;
    const state = callbacks.current;
    if (!video || !state.selected || state.paused || finished.current) return;
    const duration = playbackDuration(state.video, video.duration);
    if (video.currentTime > previousTime.current) {
      previousTime.current = video.currentTime;
      state.onProgress(video.currentTime, duration);
    }
    const quality = typeof video.getVideoPlaybackQuality === 'function' ? video.getVideoPlaybackQuality() : null;
    if (quality) state.onSample?.(quality.droppedVideoFrames, quality.totalVideoFrames);
    if (video.ended || duration > 0 && video.currentTime >= duration - 0.05) finish();
  };
  const recover = () => {
    const fallback = callbacks.current.video.fallback_url;
    if (!fallback || usedFallback.current) return false;
    usedFallback.current = true; setSource(fallback); return true;
  };
  const play = () => {
    void media.current?.play()?.catch((error: Error) => {
      if (error.name === 'NotAllowedError' && callbacks.current.selected && !callbacks.current.paused) callbacks.current.onBlocked();
    });
  };
  useEffect(() => {
    if (props.selected && !wasSelected.current && media.current) {
      reset();
      if (everSelected.current) media.current.currentTime = 0;
    }
    if (props.selected) everSelected.current = true;
    if (!props.selected) cancelReady();
    wasSelected.current = props.selected;
  }, [props.selected, reset, cancelReady]);
  // Whole-stage unmount must not announce readiness for a stale source.
  useEffect(() => () => cancelReady(), [cancelReady]);
  useImperativeHandle(ref, () => ({ play, recover, restart: () => { reset(); if (media.current) media.current.currentTime = 0; play(); } }));
  useEffect(() => { reset(); setPrepared(false); media.current?.load(); }, [source, reset]);
  useEffect(() => { if (props.paused) { cancelReady(); media.current?.pause(); } else play(); }, [props.paused, source, cancelReady]);
  const reportRef = useRef(report); reportRef.current = report;
  useEffect(() => {
    const timer = setInterval(() => reportRef.current(), 500);
    return () => clearInterval(timer);
  }, []);
  return <video ref={media} src={source} aria-label={props.selected ? 'Vídeo em exibição' : undefined}
    aria-hidden={!props.selected} data-tv-prepared={prepared} autoPlay={props.selected && !props.paused} muted={props.muted} playsInline preload="auto" controls={false} disablePictureInPicture
    className="h-full w-full" style={{ objectFit: resolveFit(props.video) }}
    onLoadedData={() => setPrepared(true)}
    onWaiting={() => { if (callbacks.current.selected && !callbacks.current.paused) callbacks.current.onStall?.(); }}
    onPlaying={announceReady}
    onCanPlay={() => { if (callbacks.current.selected && !callbacks.current.paused) play(); }}
    onPause={() => { if (callbacks.current.selected && !callbacks.current.paused && media.current && !media.current.ended && media.current.readyState >= 2) play(); }}
    onTimeUpdate={report} onEnded={finish} onError={() => { if (!callbacks.current.selected) return; if (!recover()) callbacks.current.onError(); }} />;
});

const YouTubeDeck = forwardRef<PlaybackHandle, DeckProps>(function YouTubeDeck(props, ref) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YouTubePlayer>();
  const ready = useRef(false);
  const finished = useRef(false);
  const wasSelected = useRef(props.selected);
  useEffect(() => {
    if (props.selected && !wasSelected.current && ready.current) { finished.current = false; player.current?.seekTo(0, true); }
    wasSelected.current = props.selected;
  }, [props.selected]);
  const callbacks = useRef(props); callbacks.current = props;
  useImperativeHandle(ref, () => ({ play: () => player.current?.playVideo(), restart: () => { finished.current = false; player.current?.seekTo(0, true); player.current?.playVideo(); } }));
  useEffect(() => {
    let cancelled = false;
    let instance: YouTubePlayer | undefined;
    let previousTime = -1;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let autoplayRetryUsed = false;
    let pauseRetries = 0;
    const apply = () => {
      if (!instance || !ready.current) return;
      if (callbacks.current.muted) instance.mute(); else instance.unMute();
      if (callbacks.current.paused) instance.pauseVideo(); else instance.playVideo();
    };
    const canResume = () => !cancelled && ready.current && callbacks.current.selected && !callbacks.current.paused && !finished.current;
    const retryPlayback = () => {
      clearTimeout(retryTimer);
      retryTimer = setTimeout(() => { if (canResume()) apply(); }, 500);
    };
    const resumeWhenVisible = () => { if (document.visibilityState === 'visible' && canResume()) apply(); };
    ready.current = false; finished.current = false;
    const finish = () => {
      if (finished.current || callbacks.current.paused || !callbacks.current.selected) return;
      finished.current = true; callbacks.current.onEnded();
    };
    void loadYouTubeAPI().then(api => {
      if (cancelled || !host.current) return;
      const target = document.createElement('div'); host.current.appendChild(target);
      instance = new api.Player(target, {
        videoId: callbacks.current.video.youtube_id!, width: '100%', height: '100%',
        // Start via onReady so mute is applied before the first playback request.
        playerVars: { autoplay: 0, playsinline: 1, origin: window.location.origin, controls: 0, disablekb: 1, fs: 0, rel: 0 },
        events: {
          onReady: () => { if (cancelled) return; ready.current = true; apply(); },
          onStateChange: ({ data }) => {
            if (cancelled) return;
            if (data === 1 && canResume()) {
              clearTimeout(retryTimer); autoplayRetryUsed = false; pauseRetries = 0;
              callbacks.current.onReady();
            }
            // A provider pause is not an operator pause: recover without disabling
            // the TV watchdog. Explicit operator pause remains authoritative.
            if (data === 2 && canResume() && pauseRetries < 2) { pauseRetries++; retryPlayback(); }
            if (data === 0) finish();
          },
          onError: () => { if (!cancelled) callbacks.current.onError(); },
          onAutoplayBlocked: () => {
            if (!canResume()) return;
            if (!callbacks.current.muted || autoplayRetryUsed) { callbacks.current.onBlocked(); return; }
            autoplayRetryUsed = true; retryPlayback();
          },
        },
      });
      player.current = instance;
    }).catch(() => { if (!cancelled) callbacks.current.onError(); });
    const timer = setInterval(() => {
      if (!ready.current || !instance) return;
      const time = instance.getCurrentTime();
      const duration = playbackDuration(callbacks.current.video, instance.getDuration?.() ?? 0);
      if (time > previousTime && !callbacks.current.paused && callbacks.current.selected) callbacks.current.onProgress(time, duration);
      if (duration > 0 && time >= duration - 0.05) finish();
      previousTime = time;
    }, 1000);
    document.addEventListener('visibilitychange', resumeWhenVisible);
    window.addEventListener('online', resumeWhenVisible);
    return () => {
      cancelled = true; ready.current = false; clearInterval(timer); clearTimeout(retryTimer);
      document.removeEventListener('visibilitychange', resumeWhenVisible);
      window.removeEventListener('online', resumeWhenVisible);
      instance?.destroy(); player.current = undefined;
    };
  }, [props.video.youtube_id]);
  useEffect(() => {
    if (!ready.current || !player.current) return;
    if (props.muted) player.current.mute(); else player.current.unMute();
    if (props.paused) player.current.pauseVideo(); else player.current.playVideo();
  }, [props.muted, props.paused]);
  return <div ref={host} className="h-full w-full" aria-label={props.selected ? `YouTube: ${props.video.title}` : undefined} aria-hidden={!props.selected} />;
});

type StageProps = Omit<DeckProps, 'selected' | 'onSample' | 'onStall'> & {
  /** Next eligible item; native files are prepared (paused, muted, hidden) in advance. */
  upcoming?: TVVideo | null;
  onReducedEffects?(reduced: boolean): void;
};
type Handoff = { from: string; to: string; serial: number; presentation: ResolvedPresentation };
const STEADY_MS = 700;

export default forwardRef<PlaybackHandle, StageProps>(function CinematicStage(props, ref) {
  const key = videoSourceKey(props.video);
  const [decks, setDecks] = useState([props.video]);
  const [front, setFront] = useState<string | null>(null);
  const [handoff, setHandoff] = useState<Handoff | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const visibleKey = useRef(front); visibleKey.current = front;
  const activeHandoff = useRef(handoff); activeHandoff.current = handoff;
  const serial = useRef(0);
  const clock = useRef({ serial: 0, remaining: STEADY_MS + 100 });
  const pressure = useRef(createPressureTracker());
  const [reducedEffects, setReducedEffects] = useState(false);
  const notePressure = (value: boolean) => { if (value && !reducedEffects) { setReducedEffects(true); latest.current.onReducedEffects?.(true); } };
  const upcoming = props.upcoming && props.upcoming.source_type !== 'youtube' ? props.upcoming : null;
  const upcomingKey = upcoming ? videoSourceKey(upcoming) : null;
  const handles = useRef(new Map<string, PlaybackHandle>());
  const selected = useRef(key); selected.current = key;
  const latest = useRef(props); latest.current = props;

  const finishHandoff = useCallback((expectedSerial: number) => {
    if (activeHandoff.current?.serial !== expectedSerial) return;
    activeHandoff.current = null;
    setHandoff(null);
  }, []);

  useEffect(() => {
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!preference) return;
    const update = () => setReducedMotion(preference.matches);
    if (preference.addEventListener) preference.addEventListener('change', update);
    else preference.addListener(update);
    return () => {
      if (preference.removeEventListener) preference.removeEventListener('change', update);
      else preference.removeListener(update);
    };
  }, []);

  useEffect(() => {
    if (!handoff) return;
    if (reducedMotion) { finishHandoff(handoff.serial); return; }
    if (clock.current.serial !== handoff.serial) clock.current = { serial: handoff.serial, remaining: handoff.presentation.durationMs + 100 };
    if (props.paused) return;
    const started = performance.now();
    const timer = setTimeout(() => { if (!latest.current.paused) finishHandoff(handoff.serial); }, clock.current.remaining);
    return () => {
      clearTimeout(timer);
      clock.current.remaining = Math.max(0, clock.current.remaining - (performance.now() - started));
    };
  }, [handoff, props.paused, reducedMotion, finishHandoff]);

  useEffect(() => {
    setDecks(previous => {
      // A metadata refresh must not remove the opaque backing frame mid-dissolve.
      // Queue rapid skips until this pair completes instead of opening a third decoder.
      if (handoff) return previous.map(video => videoSourceKey(video) === key ? props.video : video);
      const visible = previous.find(video => videoSourceKey(video) === visibleKey.current);
      if (visible && videoSourceKey(visible) !== key) return [visible, props.video];
      // Steady state: the second (and last) slot prepares the next native source.
      // A replanned upcoming item replaces it; it never becomes a third deck.
      return upcoming && upcomingKey !== key ? [props.video, upcoming] : [props.video];
    });
  }, [key, props.video, front, handoff, upcoming, upcomingKey]);
  useImperativeHandle(ref, () => ({
    play: () => handles.current.get(selected.current)?.play(),
    restart: () => handles.current.get(selected.current)?.restart(),
    recover: () => handles.current.get(selected.current)?.recover?.() ?? false,
  }));
  const presentation = handoff?.presentation;
  return <div className={`tv-cinema-stage absolute inset-0 overflow-hidden ${props.paused ? 'tv-cinema-paused' : ''}`}
    data-tv-transition={presentation ? presentation.profile : 'steady'}
    data-tv-palette={presentation?.palette} data-tv-effects={reducedEffects ? 'reduced' : 'full'}
    style={{ '--tv-dissolve-duration': `${presentation?.durationMs ?? STEADY_MS}ms`, ...(presentation ? { '--tv-light-rgb': PALETTE_RGB[presentation.palette] } : {}) } as CSSProperties}>
    {decks.map(video => {
      const id = videoSourceKey(video);
      const isSelected = id === key && (!handoff || handoff.to === key);
      const visible = front === id;
      const outgoing = handoff?.from === id;
      const entering = handoff?.to === id;
      const scale = entering && !!presentation?.scale;
      const Deck = video.source_type === 'youtube' ? YouTubeDeck : FileDeck;
      return <div key={id} data-tv-deck={video.id} data-visible={visible} data-tv-phase={outgoing ? 'outgoing' : entering ? 'entering' : visible ? 'front' : 'preparing'}
        {...(!isSelected ? { inert: "" } : {})}
        className={`tv-cinema-deck bg-brown-deep ${video.source_type === 'youtube' ? 'tv-cinema-youtube' : ''} ${visible ? 'tv-cinema-visible' : ''} ${outgoing ? 'tv-cinema-outgoing' : ''} ${entering ? 'tv-cinema-entering' : ''} ${scale ? 'tv-cinema-scale' : ''}`}
        aria-hidden={!isSelected}
        onAnimationEnd={event => {
          if (event.target !== event.currentTarget || !['tv-cinema-reveal', 'tv-cinema-dissolve'].includes(event.animationName)) return;
          const active = activeHandoff.current;
          if (active?.to === id && !latest.current.paused) finishHandoff(active.serial);
        }}>
        <Deck ref={handle => { if (handle) handles.current.set(id, handle); else handles.current.delete(id); }}
          video={video} selected={isSelected} paused={!isSelected || props.paused} muted={!isSelected || props.muted}
          onReady={() => {
            if (selected.current !== id || latest.current.paused || (activeHandoff.current && activeHandoff.current.to !== id)) return;
            const previous = visibleKey.current;
            if (previous !== id) {
              visibleKey.current = id;
              setFront(id);
              if (previous && !reducedMotion) {
                const next = { from: previous, to: id, serial: ++serial.current, presentation: resolvePairPresentation(video, decks.find(deck => videoSourceKey(deck) === previous), { reducedMotion, pressure: reducedEffects }) };
                activeHandoff.current = next;
                setHandoff(next);
              }
            }
            latest.current.onReady();
          }}
          onPaused={() => { if (selected.current === id) props.onPaused?.(); }}
          onSample={(dropped, total) => { if (selected.current === id) notePressure(pressure.current.sample(dropped, total)); }}
          onStall={() => { if (selected.current === id) notePressure(pressure.current.stall()); }}
          onProgress={(time, duration) => { if (selected.current === id) props.onProgress(time, duration); }}
          onEnded={() => { if (selected.current === id) props.onEnded(); }}
          onError={() => { if (selected.current === id) props.onError(); }}
          onBlocked={() => { if (selected.current === id) props.onBlocked(); }} />
      </div>;
    })}
    {handoff && presentation?.light && !reducedMotion && <div key={handoff.serial} className="tv-cinema-light" aria-hidden="true" />}
  </div>;
});
