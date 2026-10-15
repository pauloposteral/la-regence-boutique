import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { TVVideo } from '@/lib/tvPlaylist';
import { fileSourceUrl, playbackDuration, videoSourceKey } from '@/lib/tvPlaylist';
import { loadYouTubeAPI, type YouTubePlayer } from '@/lib/youtubePlayer';
import './cinema.css';

export interface PlaybackHandle { play(): void; restart(): void; recover?(): boolean }
interface DeckProps {
  video: TVVideo; paused: boolean; muted: boolean; selected: boolean;
  onReady(): void; onPaused?(): void; onProgress(seconds?: number, duration?: number): void; onEnded(): void; onError(): void; onBlocked(): void;
}
const FileDeck = forwardRef<PlaybackHandle, DeckProps>(function FileDeck(props, ref) {
  const media = useRef<HTMLVideoElement>(null);
  const primarySource = fileSourceUrl(props.video.url);
  const [source, setSource] = useState(primarySource);
  const usedFallback = useRef(false);
  useEffect(() => { usedFallback.current = false; setSource(primarySource); }, [primarySource]);
  const callbacks = useRef(props); callbacks.current = props;
  const wasSelected = useRef(props.selected);
  const finished = useRef(false);
  const previousTime = useRef(-1);
  const reset = () => { finished.current = false; previousTime.current = -1; };
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
    if (video.ended || duration > 0 && video.currentTime >= duration - 0.05) finish();
  };
  const recover = () => {
    const fallback = callbacks.current.video.fallback_url;
    if (!fallback || usedFallback.current) return false;
    usedFallback.current = true; setSource(fallback); return true;
  };
  const play = () => {
    void media.current?.play()?.catch((error: Error) => {
      if (error.name === 'NotAllowedError') callbacks.current.onBlocked();
    });
  };
  useEffect(() => {
    if (props.selected && !wasSelected.current && media.current) { reset(); media.current.currentTime = 0; }
    wasSelected.current = props.selected;
  }, [props.selected]);
  useImperativeHandle(ref, () => ({ play, recover, restart: () => { reset(); if (media.current) media.current.currentTime = 0; play(); } }));
  useEffect(() => { reset(); media.current?.load(); }, [source]);
  useEffect(() => { if (props.paused) media.current?.pause(); else play(); }, [props.paused, source]);
  const reportRef = useRef(report); reportRef.current = report;
  useEffect(() => {
    const timer = setInterval(() => reportRef.current(), 500);
    return () => clearInterval(timer);
  }, []);
  return <video ref={media} src={source} aria-label={props.selected ? 'Vídeo em exibição' : undefined}
    aria-hidden={!props.selected} autoPlay={props.selected && !props.paused} muted={props.muted} playsInline preload="auto" controls={false} disablePictureInPicture
    className="h-full w-full" style={{ objectFit: props.video.fit }} onPlaying={props.onReady}
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
    const apply = () => {
      if (!instance || !ready.current) return;
      if (callbacks.current.muted) instance.mute(); else instance.unMute();
      if (callbacks.current.paused) instance.pauseVideo(); else instance.playVideo();
    };
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
        playerVars: { autoplay: 0, playsinline: 1, origin: window.location.origin, controls: 1, rel: 0 },
        events: {
          onReady: () => { ready.current = true; apply(); },
          onStateChange: ({ data }) => { if (data === 1) callbacks.current.onReady(); if (data === 2 && !callbacks.current.paused) callbacks.current.onPaused?.(); if (data === 0) finish(); },
          onError: () => callbacks.current.onError(), onAutoplayBlocked: () => callbacks.current.onBlocked(),
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
    return () => { cancelled = true; ready.current = false; clearInterval(timer); instance?.destroy(); player.current = undefined; };
  }, [props.video.youtube_id]);
  useEffect(() => {
    if (!ready.current || !player.current) return;
    if (props.muted) player.current.mute(); else player.current.unMute();
    if (props.paused) player.current.pauseVideo(); else player.current.playVideo();
  }, [props.muted, props.paused]);
  return <div ref={host} className="h-full w-full" aria-label={props.selected ? `YouTube: ${props.video.title}` : undefined} aria-hidden={!props.selected} />;
});

type StageProps = Omit<DeckProps, 'selected'>;
export default forwardRef<PlaybackHandle, StageProps>(function CinematicStage(props, ref) {
  const key = videoSourceKey(props.video);
  const [decks, setDecks] = useState([props.video]);
  const [front, setFront] = useState<string | null>(null);
  const visibleKey = useRef(front); visibleKey.current = front;
  const handles = useRef(new Map<string, PlaybackHandle>());
  const selected = useRef(key); selected.current = key;
  useEffect(() => {
    setDecks(previous => {
      const visible = previous.find(video => videoSourceKey(video) === visibleKey.current);
      return visible && videoSourceKey(visible) !== key ? [visible, props.video] : [props.video];
    });
    // Keep the last visible frame until the requested source actually starts.
  }, [key, props.video]);
  useImperativeHandle(ref, () => ({
    play: () => handles.current.get(selected.current)?.play(),
    restart: () => handles.current.get(selected.current)?.restart(),
    recover: () => handles.current.get(selected.current)?.recover?.() ?? false,
  }));
  return <div className="absolute inset-0 overflow-hidden">
    {decks.map(video => {
      const id = videoSourceKey(video);
      const isSelected = id === key;
      const visible = front === id;
      const Deck = video.source_type === 'youtube' ? YouTubeDeck : FileDeck;
      return <div key={id} data-tv-deck={video.id} data-visible={visible} {...(!isSelected ? { inert: "" } : {})} className={`tv-cinema-deck ${video.source_type === 'youtube' ? 'tv-cinema-youtube' : ''} ${visible ? 'tv-cinema-visible' : ''}`} aria-hidden={!isSelected}>
        <Deck ref={handle => { if (handle) handles.current.set(id, handle); else handles.current.delete(id); }}
          video={video} selected={isSelected} paused={!isSelected || props.paused} muted={!isSelected || props.muted}
          onReady={() => { if (selected.current === id) { setFront(id); props.onReady(); } }}
          onPaused={() => { if (selected.current === id) props.onPaused?.(); }}
          onProgress={(time, duration) => { if (selected.current === id) props.onProgress(time, duration); }}
          onEnded={() => { if (selected.current === id) props.onEnded(); }}
          onError={() => { if (selected.current === id) props.onError(); }}
          onBlocked={() => { if (selected.current === id) props.onBlocked(); }} />
      </div>;
    })}
  </div>;
});
