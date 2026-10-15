export interface YouTubePlayer {
  playVideo(): void; pauseVideo(): void; seekTo(seconds: number, allowSeekAhead: boolean): void;
  mute(): void; unMute(): void; destroy(): void; getCurrentTime(): number;
}
export interface YouTubeAPI {
  Player: new (element: HTMLElement, options: {
    videoId: string; width: string; height: string; playerVars: Record<string, string | number>;
    events: { onReady(): void; onStateChange(event: { data: number }): void; onError(): void; onAutoplayBlocked(): void };
  }) => YouTubePlayer;
}
declare global { interface Window { YT?: YouTubeAPI; onYouTubeIframeAPIReady?: () => void } }
let pending: Promise<YouTubeAPI> | undefined;
export function loadYouTubeAPI(): Promise<YouTubeAPI> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (pending) return pending;
  pending = new Promise<YouTubeAPI>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    const script = document.createElement('script');
    const finish = (error?: Error) => {
      clearTimeout(timeout);
      window.onYouTubeIframeAPIReady = previous;
      if (error) { script.remove(); reject(error); } else if (window.YT) resolve(window.YT);
    };
    const timeout = setTimeout(() => finish(new Error('YouTube indisponível')), 15000);
    window.onYouTubeIframeAPIReady = () => { previous?.(); finish(); };
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => finish(new Error('YouTube indisponível'));
    document.head.appendChild(script);
  }).catch(error => { pending = undefined; throw error; });
  return pending;
}
