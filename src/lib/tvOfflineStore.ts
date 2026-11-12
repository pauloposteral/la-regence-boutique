import type { TVVideo } from "./tvPlaylist";
import {
  acquireMedia, OFFLINE_LIMITS, offlineCandidates, parseSnapshotRows, planWarmSet, sanitizeSnapshotRows,
  serializeSnapshotRows, snapshotRevision, TV_MANIFEST_KEY, TV_MEDIA_CACHE, TV_SNAPSHOT_CACHE, TV_SNAPSHOT_KEY, type ReadyRecord,
} from "./tvOffline";

/**
 * CacheStorage-backed offline state for the public /video page. Same-origin page
 * JavaScript is the trust boundary: it writes only sanitised public rows and media
 * that passed acquireMedia; the service worker serves a file only while it is both
 * ready and eligible in the committed manifest.
 */
export interface OfflineManifest {
  schema: 1;
  generation: number;
  revision: string | null;
  savedAt: number | null;
  eligible: string[];
  ready: Record<string, ReadyRecord>;
  failures: Record<string, number>;
  quotaPausedUntil: number;
}
export interface OfflineStatus {
  available: boolean;
  revision: string | null;
  savedAt: number | null;
  eligibleCount: number;
  cachedCount: number;
  cachedBytes: number;
  readyKeys: Set<string>;
  rows: TVVideo[] | null;
}
export const UNAVAILABLE_STATUS: OfflineStatus = { available: false, revision: null, savedAt: null, eligibleCount: 0, cachedCount: 0, cachedBytes: 0, readyKeys: new Set(), rows: null };

const emptyManifest = (): OfflineManifest => ({ schema: 1, generation: 0, revision: null, savedAt: null, eligible: [], ready: {}, failures: {}, quotaPausedUntil: 0 });

function validManifest(value: unknown): OfflineManifest | null {
  if (!value || typeof value !== "object") return null;
  const m = value as OfflineManifest;
  if (m.schema !== 1 || !Number.isSafeInteger(m.generation) || !Array.isArray(m.eligible) || typeof m.ready !== "object" || !m.ready) return null;
  if (m.eligible.length > OFFLINE_LIMITS.snapshotRows * 2 || Object.keys(m.ready).length > OFFLINE_LIMITS.entries) return null;
  for (const record of Object.values(m.ready)) if (!Number.isSafeInteger(record?.bytes) || record.bytes <= 0 || record.bytes > OFFLINE_LIMITS.fileBytes) return null;
  return { ...emptyManifest(), ...m, failures: m.failures && typeof m.failures === "object" ? m.failures : {} };
}

const isQuotaError = (error: unknown) => error instanceof DOMException && (error.name === "QuotaExceededError" || error.code === 22);
const jsonResponse = (value: unknown) => new Response(JSON.stringify(value), { headers: { "content-type": "application/json" } });

export interface StoreDeps {
  /** Resolved lazily inside try: the getter itself may throw in sandboxed/private contexts. */
  getCaches?: () => CacheStorage | undefined;
  fetch?: typeof fetch;
  now?: () => number;
  appOrigin?: string;
  /** Cross-tab serialization; falls back to an in-page queue. */
  getLocks?: () => LockManager | undefined;
}

export function createOfflineStore(deps: StoreDeps = {}) {
  const now = deps.now ?? (() => Date.now());
  const appOrigin = deps.appOrigin ?? window.location.origin;
  const cachesOf = (): CacheStorage | undefined => {
    try { return (deps.getCaches ?? (() => window.caches))(); } catch { return undefined; }
  };
  let queue: Promise<unknown> = Promise.resolve();
  const serialize = <T,>(task: () => Promise<T>): Promise<T> => {
    let locks: LockManager | undefined;
    try { locks = (deps.getLocks ?? (() => navigator.locks))(); } catch { locks = undefined; }
    const run = locks ? () => locks!.request("lr-tv-offline", task) as Promise<T> : task;
    const next = queue.then(run, run);
    queue = next.catch(() => undefined);
    return next;
  };
  let inflight: { key: string; controller: AbortController } | null = null;

  async function read(): Promise<{ manifest: OfflineManifest; rows: TVVideo[] | null }> {
    const storage = cachesOf();
    if (!storage) throw new Error("unavailable");
    const cache = await storage.open(TV_SNAPSHOT_CACHE);
    const [m, s] = await Promise.all([cache.match(TV_MANIFEST_KEY), cache.match(TV_SNAPSHOT_KEY)]);
    const manifest = m ? validManifest(await m.json().catch(() => null)) ?? emptyManifest() : emptyManifest();
    const rows = s ? parseSnapshotRows(await s.text()) : null;
    return { manifest, rows };
  }
  async function writeManifest(manifest: OfflineManifest, rowsJson?: string) {
    const cache = await cachesOf()!.open(TV_SNAPSHOT_CACHE);
    // The snapshot is written first and the manifest (authoritative) last.
    if (rowsJson !== undefined) await cache.put(TV_SNAPSHOT_KEY, new Response(rowsJson, { headers: { "content-type": "application/json" } }));
    await cache.put(TV_MANIFEST_KEY, jsonResponse(manifest));
  }
  async function deleteMedia(keys: string[]) {
    if (!keys.length) return;
    try { const media = await cachesOf()!.open(TV_MEDIA_CACHE); await Promise.all(keys.map(key => media.delete(key).catch(() => false))); } catch { /* best effort; manifest already revoked */ }
  }
  const toStatus = (manifest: OfflineManifest, rows: TVVideo[] | null): OfflineStatus => {
    const eligible = new Set(manifest.eligible);
    const readyKeys = new Set(Object.keys(manifest.ready).filter(key => eligible.has(key)));
    return { available: true, revision: manifest.revision, savedAt: manifest.savedAt, eligibleCount: manifest.eligible.length,
      cachedCount: readyKeys.size, cachedBytes: [...readyKeys].reduce((sum, key) => sum + manifest.ready[key].bytes, 0), readyKeys, rows };
  };

  return {
    async status(): Promise<OfflineStatus> {
      try { const { manifest, rows } = await read(); return toStatus(manifest, rows); } catch { return UNAVAILABLE_STATUS; }
    },

    /** Reconcile after restart: drop staging/orphans and ready records whose file vanished. */
    async reconcile(): Promise<void> {
      try {
        await serialize(async () => {
          const { manifest } = await read();
          const media = await cachesOf()!.open(TV_MEDIA_CACHE);
          const stored = (await media.keys()).map(request => request.url);
          const orphans = stored.filter(url => !manifest.ready[url] || !manifest.eligible.includes(url));
          let changed = false;
          for (const key of Object.keys(manifest.ready)) {
            const hit = await media.match(key);
            const length = Number(hit?.headers.get("content-length"));
            if (!hit || !manifest.eligible.includes(key) || length !== manifest.ready[key].bytes) { delete manifest.ready[key]; changed = true; if (hit) orphans.push(key); }
          }
          if (changed) await writeManifest(manifest);
          await deleteMedia([...new Set(orphans)]);
        });
      } catch { /* storage unavailable: online playback unaffected */ }
    },

    /**
     * Commit a validated successful public playlist. Empty success is an authoritative
     * tombstone. Revocations are committed in the manifest before any file deletion.
     * Returns null when nothing changed (same revision) or storage is unavailable.
     */
    async commit(videos: readonly TVVideo[]): Promise<OfflineStatus | null> {
      const rows = sanitizeSnapshotRows(videos);
      const json = rows && serializeSnapshotRows(rows);
      if (!rows || json === null) return null;
      const revision = await snapshotRevision(json);
      try {
        return await serialize(async () => {
          const { manifest } = await read();
          if (manifest.revision === revision && manifest.savedAt !== null) { manifest.savedAt = now(); await writeManifest(manifest); return null; }
          const eligible = offlineCandidates(rows, appOrigin);
          const revoked = Object.keys(manifest.ready).filter(key => !eligible.includes(key));
          for (const key of revoked) delete manifest.ready[key];
          const next: OfflineManifest = { ...manifest, generation: manifest.generation + 1, revision, savedAt: now(), eligible };
          await writeManifest(next, json);
          if (inflight && !eligible.includes(inflight.key)) inflight.controller.abort();
          await deleteMedia(revoked);
          return toStatus(next, rows);
        });
      } catch { return null; }
    },

    /** Download at most one planned file. Returns what happened for the caller loop. */
    async warmOnce(): Promise<"downloaded" | "idle" | "failed" | "paused" | "unavailable"> {
      let plan: { key: string; generation: number } | null = null;
      try {
        plan = await serialize(async () => {
          const { manifest } = await read();
          if (manifest.quotaPausedUntil > now()) return null;
          const key = planWarmSet(manifest.eligible, manifest.ready, manifest.failures, now()).fill[0];
          return key ? { key, generation: manifest.generation } : null;
        });
      } catch { return "unavailable"; }
      if (!plan) return "idle";
      const controller = new AbortController();
      inflight = { key: plan.key, controller };
      const result = await acquireMedia(plan.key, appOrigin, { fetch: deps.fetch, signal: controller.signal });
      inflight = null;
      try {
        return await serialize(async () => {
          const { manifest } = await read();
          // Generation check: a removal/pause committed while downloading wins.
          if (!manifest.eligible.includes(plan!.key)) return "idle";
          if (!result.ok) {
            if (result.reason !== "aborted") { manifest.failures[plan!.key] = now() + OFFLINE_LIMITS.failureCooldownMs; await writeManifest(manifest); }
            return "failed";
          }
          const committed = Object.values(manifest.ready).reduce((sum, record) => sum + record.bytes, 0);
          if (Object.keys(manifest.ready).length >= OFFLINE_LIMITS.entries || committed + result.bytes > OFFLINE_LIMITS.committedBytes) {
            manifest.failures[plan!.key] = now() + OFFLINE_LIMITS.failureCooldownMs; await writeManifest(manifest); return "failed";
          }
          const media = await cachesOf()!.open(TV_MEDIA_CACHE);
          const put = () => media.put(plan!.key, new Response(result.blob, { status: 200, headers: { "content-type": "video/mp4", "content-length": String(result.bytes) } }));
          try { await put(); } catch (error) {
            if (!isQuotaError(error)) throw error;
            // Evict only entries that are no longer eligible, then retry once.
            const stale = Object.keys(manifest.ready).filter(key => !manifest.eligible.includes(key));
            for (const key of stale) delete manifest.ready[key];
            await writeManifest(manifest); await deleteMedia(stale);
            try { await put(); } catch {
              await media.delete(plan!.key).catch(() => false);
              manifest.quotaPausedUntil = now() + OFFLINE_LIMITS.quotaPauseMs; await writeManifest(manifest); return "paused";
            }
          }
          manifest.ready[plan!.key] = { bytes: result.bytes, storedAt: now() };
          delete manifest.failures[plan!.key];
          await writeManifest(manifest);
          return "downloaded";
        });
      } catch { return "unavailable"; }
    },

    /** Operator retry: clears negative caching and the quota pause. */
    async clearFailures(): Promise<void> {
      try { await serialize(async () => { const { manifest } = await read(); manifest.failures = {}; manifest.quotaPausedUntil = 0; await writeManifest(manifest); }); } catch { /* unavailable */ }
    },
  };
}
export type OfflineStore = ReturnType<typeof createOfflineStore>;
