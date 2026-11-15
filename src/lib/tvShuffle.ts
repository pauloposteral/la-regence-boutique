import { playableVideos, videoSourceKey, type TVVideo } from './tvPlaylist';

/** Uniform sampling without replacement. Reserve the source used for preloading;
 * progress renders, catalog polling and row aliases must not redraw that choice.
 * The player owns the completed/selected cycle; this picker never consumes it. */
export function createTVShuffle(random: () => number = Math.random) {
  let reservation: { context: string; source: string } | null = null;
  return {
    pick(videos: TVVideo[], currentId: string | null, failed = new Set<string>(), seen = new Set<string>()): string | null {
      const playlist = playableVideos(videos);
      const current = videos.find(v => v.id === currentId);
      const currentKey = current ? videoSourceKey(current) : null;
      const healthy = playlist.filter(v => !failed.has(v.id));
      const unseen = healthy.filter(v => !seen.has(videoSourceKey(v)) && videoSourceKey(v) !== currentKey);
      const others = healthy.filter(v => videoSourceKey(v) !== currentKey);
      const pool = unseen.length ? unseen : others.length ? others : healthy;
      if (!pool.length) { reservation = null; return null; }
      // Stable under reorder/metadata changes; invalidated at a new selection or
      // cycle. A new unseen source invalidates a repeat-only reservation too.
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
