import { playableVideos, videoSourceKey, type TVVideo } from './tvPlaylist';

type TVRound = { seen: Set<string>; lastSource: string | null };
const ROUND_KEY = 'lr-tv-round-v1';

function roundStorage(preview: string | null) {
  return preview ? window.sessionStorage : window.localStorage;
}

function storageKey(preview: string | null) {
  return preview ? ROUND_KEY + ':' + preview : ROUND_KEY;
}

export function readTVRound(remember: boolean, preview: string | null): TVRound {
  const fresh = { seen: new Set<string>(), lastSource: null };
  if (!remember) return fresh;
  try {
    // A fresh operator link starts its requested film. A reload of the same
    // pinned screen continues its own round, isolated from the salon.
    if (preview && (performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined)?.type !== 'reload') return fresh;
    const raw = roundStorage(preview).getItem(storageKey(preview));
    if (!raw) return fresh;
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved.seen) || !saved.seen.every((s: unknown) => typeof s === 'string') ||
        typeof saved.lastSource !== 'string' || !saved.seen.includes(saved.lastSource)) return fresh;
    return { seen: new Set<string>(saved.seen), lastSource: saved.lastSource };
  } catch { return fresh; }
}

export function saveTVRound(preview: string | null, seen: Set<string>, lastSource: string, playlist: TVVideo[]) {
  try {
    const active = playlist.map(videoSourceKey).filter(key => seen.has(key));
    roundStorage(preview).setItem(storageKey(preview), JSON.stringify({ seen: active, lastSource }));
  } catch { /* Continue the in-memory round if the TV denies web storage. */ }
}

function rotationGroup(video: TVVideo): string {
  return video.rotation_group || videoSourceKey(video);
}

/** Reserve the next source so polling, progress and preloading agree. Each
 * source gets one turn; different edits of a product are spaced when possible. */
export function createTVShuffle(random: () => number = Math.random) {
  let reservation: { context: string; source: string } | null = null;
  return {
    pick(videos: TVVideo[], currentId: string | null, failed = new Set<string>(), seen = new Set<string>(), previousSource: string | null = null): string | null {
      const playlist = playableVideos(videos);
      const current = videos.find(v => v.id === currentId) ?? playlist.find(v => videoSourceKey(v) === previousSource);
      const currentKey = current ? videoSourceKey(current) : previousSource;
      const healthy = playlist.filter(v => !failed.has(v.id));
      const unseen = healthy.filter(v => !seen.has(videoSourceKey(v)) && videoSourceKey(v) !== currentKey);
      const remaining = unseen.length ? unseen : healthy;
      const others = remaining.filter(v => videoSourceKey(v) !== currentKey);
      let pool = others.length ? others : remaining;
      if (!pool.length) { reservation = null; return null; }

      if (current) {
        const otherProducts = pool.filter(v => rotationGroup(v) !== rotationGroup(current));
        if (otherProducts.length) pool = otherProducts;
      }
      // If one campaign owns more than half the remaining slots, giving it a
      // turn now avoids leaving several of its editions together at the end.
      const counts = new Map<string, number>();
      for (const video of remaining) {
        const group = rotationGroup(video);
        counts.set(group, (counts.get(group) ?? 0) + 1);
      }
      const majority = pool.filter(v => (counts.get(rotationGroup(v)) ?? 0) * 2 > remaining.length);
      if (majority.length) pool = majority;

      const context = JSON.stringify([currentKey, [...seen].sort(), unseen.length > 0]);
      const retained = reservation?.context === context ? pool.find(v => videoSourceKey(v) === reservation?.source) : null;
      if (retained) return retained.id;
      const draw = random();
      const index = Number.isFinite(draw) ? Math.max(0, Math.min(pool.length - 1, Math.floor(draw * pool.length))) : 0;
      const next = pool[index];
      reservation = { context, source: videoSourceKey(next) };
      return next.id;
    },
  };
}
