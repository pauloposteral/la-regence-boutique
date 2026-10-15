import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { TVVideo } from '@/lib/tvPlaylist';
import { loadYouTubeAPI, type YouTubePlayer } from '@/lib/youtubePlayer';
import './cinema.css';

export interface PlaybackHandle { play(): void; restart(): void }
interface DeckProps {
  video: TVVideo; paused: boolean; muted: boolean; selected: boolean;
  onReady(): void; onPaused?(): void; onProgress(): void; onEnded(): void; onError(): void; onBlocked(): void;
}
const FileDeck = forwardRef<PlaybackHandle, DeckProps>(function FileDeck(props, ref) {
  const media = useRef<HTMLVideoElement>(null);
  const callbacks = useRef(props); callbacks.current = props;
  const wasSelected = useRef(props.selected);
  useEffect(() => {
    if (props.selected && !wasSelected.current && media.current) media.current.currentTime = 0;
    wasSelected.current = props.selected;
  }, [props.selected]);
  const play = () => {
    void media.current?.play()?.catch((error: Error) => {
      if (error.name === 'NotAllowedError') callbacks.current.onBlocked();
    });
  };
  useImperativeHandle(ref, () => ({ play, restart: () => { if (media.current) media.current.currentTime = 0; play(); } }));
  useEffect(() => { media.current?.load(); }, [props.video.url]);
  useEffect(() => { if (props.paused) media.current?.pause(); else play(); }, [props.paused, props.video.url]);
  return <video ref={media} src={props.video.url} aria-label={props.selected ? 'Vídeo em exibição' : undefined}
    aria-hidden={!props.selected} muted={props.muted} playsInline preload="auto" controls={false} disablePictureInPicture
    className="h-full w-full" style={{ objectFit: props.video.fit }} onPlaying={props.onReady}
    onTimeUpdate={props.onProgress} onEnded={props.onEnded} onError={props.onError} />;
});

const YouTubeDeck = forwardRef<PlaybackHandle, DeckProps>(function YouTubeDeck(props, ref) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YouTubePlayer>();
  const ready = useRef(false);
  const wasSelected = useRef(props.selected);
  useEffect(() => {
    if (props.selected && !wasSelected.current && ready.current) player.current?.seekTo(0, true);
    wasSelected.current = props.selected;
  }, [props.selected]);
  const callbacks = useRef(props); callbacks.current = props;
  useImperativeHandle(ref, () => ({ play: () => player.current?.playVideo(), restart: () => { player.current?.seekTo(0, true); player.current?.playVideo(); } }));
  useEffect(() => {
    let cancelled = false;
    let instance: YouTubePlayer | undefined;
    let previousTime = -1;
    const apply = () => {
      if (!instance || !ready.current) return;
      if (callbacks.current.muted) instance.mute(); else instance.unMute();
      if (callbacks.current.paused) instance.pauseVideo(); else instance.playVideo();
    };
    ready.current = false;
    void loadYouTubeAPI().then(api => {
      if (cancelled || !host.current) return;
      const target = document.createElement('div'); host.current.appendChild(target);
      instance = new api.Player(target, {
        videoId: callbacks.current.video.youtube_id!, width: '100%', height: '100%',
        playerVars: { autoplay: 0, playsinline: 1, origin: window.location.origin, controls: 1, rel: 0 },
        events: {
          onReady: () => { ready.current = true; apply(); },
          onStateChange: ({ data }) => { if (data === 1) callbacks.current.onReady(); if (data === 2 && !callbacks.current.paused) callbacks.current.onPaused?.(); if (data === 0) callbacks.current.onEnded(); },
          onError: () => callbacks.current.onError(), onAutoplayBlocked: () => callbacks.current.onBlocked(),
        },
      });
      player.current = instance;
    }).catch(() => { if (!cancelled) callbacks.current.onError(); });
    const timer = setInterval(() => {
      if (!ready.current || !instance) return;
      const time = instance.getCurrentTime();
      if (time > previousTime) callbacks.current.onProgress();
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
  const key = `${props.video.id}:${props.video.url}`;
  const [decks, setDecks] = useState([props.video]);
  const [front, setFront] = useState<string | null>(null);
  const visibleKey = useRef(front); visibleKey.current = front;
  const handles = useRef(new Map<string, PlaybackHandle>());
  const selected = useRef(key); selected.current = key;
  useEffect(() => {
    setDecks(previous => {
      const visible = previous.find(video => `${video.id}:${video.url}` === visibleKey.current);
      return visible && `${visible.id}:${visible.url}` !== key ? [visible, props.video] : [props.video];
    });
    // Keep the last visible frame until the requested source actually starts.
  }, [key, props.video]);
  useImperativeHandle(ref, () => ({
    play: () => handles.current.get(selected.current)?.play(),
    restart: () => handles.current.get(selected.current)?.restart(),
  }));
  return <div className="absolute inset-0 overflow-hidden">
    {decks.map(video => {
      const id = `${video.id}:${video.url}`;
      const isSelected = id === key;
      const visible = front === id;
      const Deck = video.source_type === 'youtube' ? YouTubeDeck : FileDeck;
      return <div key={id} data-tv-deck={video.id} data-visible={visible} {...(!isSelected ? { inert: "" } : {})} className={`tv-cinema-deck ${video.source_type === 'youtube' ? 'tv-cinema-youtube' : ''} ${visible ? 'tv-cinema-visible' : ''}`} aria-hidden={!isSelected}>
        <Deck ref={handle => { if (handle) handles.current.set(id, handle); else handles.current.delete(id); }}
          video={video} selected={isSelected} paused={!isSelected || props.paused} muted={!isSelected || props.muted}
          onReady={() => { if (selected.current === id) { setFront(id); props.onReady(); } }}
          onPaused={() => { if (selected.current === id) props.onPaused?.(); }}
          onProgress={() => { if (selected.current === id) props.onProgress(); }}
          onEnded={() => { if (selected.current === id) props.onEnded(); }}
          onError={() => { if (selected.current === id) props.onError(); }}
          onBlocked={() => { if (selected.current === id) props.onBlocked(); }} />
      </div>;
    })}
  </div>;
});
