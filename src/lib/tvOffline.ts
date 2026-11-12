import type { TVVideo } from "./tvPlaylist";

/**
 * Pure rules for bounded offline TV playback (Task 2). The service worker keeps
 * a plain-JS copy of the URL allowlist and range rules in public/tv-offline-sw.js;
 * tvOfflineSw.test.ts runs the same URL table against both so they cannot drift.
 */
export const TV_MEDIA_CACHE = "lr-tv-media-v1";
export const TV_SNAPSHOT_CACHE = "lr-tv-public-snapshot-v1";
export const TV_MANIFEST_KEY = "/__lr-tv/manifest.json";
export const TV_SNAPSHOT_KEY = "/__lr-tv/snapshot.json";

const MiB = 1024 * 1024;
export const OFFLINE_LIMITS = {
  fileBytes: 32 * MiB,
  committedBytes: 192 * MiB,
  entries: 12,
  stagingBytes: 32 * MiB,
  downloadTimeoutMs: 60_000,
  snapshotBytes: 128 * 1024,
  snapshotRows: 100,
  failureCooldownMs: 15 * 60_000,
  quotaPauseMs: 30 * 60_000,
  materializations: 2,
  initialFetchTimeoutMs: 8_000,
} as const;

const REMOTE_SOURCES = [
  { origin: "https://uuuaylqjllxqjjmvdybm.supabase.co", prefix: "/storage/v1/object/public/tv-videos/" },
  { origin: "https://d2ol7oe51mr4n9.cloudfront.net", prefix: "/user_3J2SlCJJLnfr1N2QBaW2NNwSJSQ/" },
] as const;
export const SAME_ORIGIN_MEDIA_PREFIX = "/__l5e/assets-v1/656fe082-70c0-4e39-9ba3-b99f4a1fb7c4/";

/**
 * Canonical cache identity of an approved owned MP4, or null. The fragment is
 * dropped from identity only (playback keeps it); the query stays significant.
 */
export function offlineMediaKey(raw: unknown, appOrigin: string): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2048) return null;
  const text = raw.trim();
  // Encoded separators/traversal, backslashes, whitespace and control characters are never normalised into an allowed path.
  if (/[\\\s\u0000-\u001f]/.test(text) || /%(2e|2f|5c|00)/i.test(text) || text.includes("..")) return null;
  if (/^(blob|data|javascript):/i.test(text)) return null;
  let url: URL;
  try { url = new URL(text, appOrigin); } catch { return null; }
  if (url.username || url.password || url.port) return null;
  if (url.pathname.includes("//") || !url.pathname.toLowerCase().endsWith(".mp4")) return null;
  const remote = REMOTE_SOURCES.find(source => source.origin === url.origin);
  if (remote) {
    if (url.protocol !== "https:" || !url.pathname.startsWith(remote.prefix) || url.pathname.length <= remote.prefix.length) return null;
  } else if (url.origin !== appOrigin || !url.pathname.startsWith(SAME_ORIGIN_MEDIA_PREFIX)) return null;
  return `${url.origin}${url.pathname}${url.search}`;
}

/** Canonical keys of every cacheable native source/fallback, in playlist order, aliases once. */
export function offlineCandidates(rows: readonly TVVideo[], appOrigin: string): string[] {
  const keys: string[] = [];
  for (const row of rows) {
    if (row.source_type === "youtube") continue;
    for (const url of [row.url, row.fallback_url]) {
      const key = offlineMediaKey(url, appOrigin);
      if (key && !keys.includes(key)) keys.push(key);
    }
  }
  return keys;
}

// ---------- Public snapshot ----------
const UUIDISH = /^[0-9a-f-]{1,64}$/i;
const text = (value: unknown, max: number): string | null => typeof value === "string" && value.length <= max ? value : null;
const optionalText = (value: unknown, max: number): string | null => value == null ? null : text(value, max);
const optionalInt = (value: unknown, min: number, max: number): number | null =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : null;

/** Only fields the public player uses; unknown/private properties are dropped. */
export function sanitizeSnapshotRows(input: unknown): TVVideo[] | null {
  if (!Array.isArray(input) || input.length > OFFLINE_LIMITS.snapshotRows) return null;
  const rows: TVVideo[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") return null;
    const row = raw as Record<string, unknown>;
    const id = text(row.id, 64); const url = text(row.url, 2048); const title = text(row.title, 200);
    if (!id || !UUIDISH.test(id) || url === null || title === null) return null;
    if (row.active !== true || row.archived_at != null) continue;
    const youtube = row.source_type === "youtube";
    rows.push({
      id, title, url, storage_path: null, active: true, archived_at: null,
      sort_order: optionalInt(row.sort_order, -2_147_483_648, 2_147_483_647) ?? 0,
      fit: row.fit === "cover" ? "cover" : "contain",
      source_type: youtube ? "youtube" : "file",
      youtube_id: youtube ? optionalText(row.youtube_id, 32) : null,
      fallback_url: optionalText(row.fallback_url, 2048),
      poster_url: optionalText(row.poster_url, 2048),
      max_duration_seconds: optionalInt(row.max_duration_seconds, 1, 86_400),
      transition_profile: optionalText(row.transition_profile, 16),
      transition_ms: optionalInt(row.transition_ms, 0, 5_000),
      palette: optionalText(row.palette, 16),
      protect_qr: row.protect_qr === true, protect_text: row.protect_text === true, protect_zoom: row.protect_zoom === true,
    });
  }
  return rows;
}

const SNAPSHOT_FIELDS = ["id", "title", "url", "sort_order", "fit", "source_type", "youtube_id", "fallback_url", "poster_url",
  "max_duration_seconds", "transition_profile", "transition_ms", "palette", "protect_qr", "protect_text", "protect_zoom"] as const;

/** Canonical (fixed key order) serialization; null when over the byte budget. */
export function serializeSnapshotRows(rows: readonly TVVideo[]): string | null {
  const json = JSON.stringify(rows.map(row => SNAPSHOT_FIELDS.map(field => (row as unknown as Record<string, unknown>)[field] ?? null)));
  return new TextEncoder().encode(json).byteLength <= OFFLINE_LIMITS.snapshotBytes ? json : null;
}

export function parseSnapshotRows(json: string): TVVideo[] | null {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    return sanitizeSnapshotRows(parsed.map(values => Array.isArray(values)
      ? Object.fromEntries(SNAPSHOT_FIELDS.map((field, index) => [field, values[index]]).concat([["active", true], ["archived_at", null]]))
      : null));
  } catch { return null; }
}

export async function snapshotRevision(json: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(json));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

// ---------- Deterministic warm set ----------
export interface ReadyRecord { bytes: number; storedAt: number }
export interface WarmPlan { retain: string[]; fill: string[]; evict: string[] }

/**
 * Retain-first plan for one revision: keep still-eligible ready files (never
 * evicted to make room for another), evict only sources that left the program,
 * then fill remaining entry capacity in playlist order, skipping cooling sources.
 * Playback position plays no part, so loops/polls cannot rotate the set.
 */
export function planWarmSet(candidates: readonly string[], ready: Readonly<Record<string, ReadyRecord>>, failures: Readonly<Record<string, number>>, now: number): WarmPlan {
  const eligible = new Set(candidates);
  const evict = Object.keys(ready).filter(key => !eligible.has(key)).sort();
  const retain = candidates.filter(key => ready[key]);
  let bytes = retain.reduce((sum, key) => sum + ready[key].bytes, 0);
  let entries = retain.length;
  const fill: string[] = [];
  for (const key of candidates) {
    if (ready[key] || (failures[key] ?? 0) > now) continue;
    // A new file needs room for a worst-case 32 MiB body under the committed budget.
    if (entries >= OFFLINE_LIMITS.entries || bytes + OFFLINE_LIMITS.fileBytes > OFFLINE_LIMITS.committedBytes) break;
    fill.push(key); entries++; bytes += OFFLINE_LIMITS.fileBytes;
  }
  return { retain, fill, evict };
}

// ---------- Bounded acquisition ----------
export function createSemaphore(size: number) {
  let free = size; const queue: Array<() => void> = [];
  return {
    async acquire(): Promise<() => void> {
      if (free > 0) free--; else await new Promise<void>(resolve => queue.push(resolve));
      let released = false;
      return () => { if (released) return; released = true; const next = queue.shift(); if (next) next(); else free++; };
    },
    get available() { return free; },
  };
}
/** Shared by every whole-file materialization in this page (max two 32 MiB payloads). */
export const materializationSlots = createSemaphore(OFFLINE_LIMITS.materializations);

export type AcquireResult = { ok: true; blob: Blob; bytes: number } | { ok: false; reason: string };

/**
 * Fetch one approved MP4 as a full 200 response with bounded streaming. Nothing is
 * cached here; the caller publishes the Blob only after every check passed.
 */
export async function acquireMedia(key: string, appOrigin: string, options: { fetch?: typeof fetch; signal?: AbortSignal; timeoutMs?: number; limit?: number } = {}): Promise<AcquireResult> {
  if (offlineMediaKey(key, appOrigin) !== key) return { ok: false, reason: "url" };
  const limit = options.limit ?? OFFLINE_LIMITS.fileBytes;
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort);
  const timer = setTimeout(abort, options.timeoutMs ?? OFFLINE_LIMITS.downloadTimeoutMs);
  const release = await materializationSlots.acquire();
  try {
    const response = await (options.fetch ?? fetch)(key, { credentials: "omit", redirect: "error", mode: "cors", cache: "no-store", signal: controller.signal });
    if (response.type === "opaque" || response.type === "opaqueredirect") return { ok: false, reason: "opaque" };
    if (response.status !== 200) return { ok: false, reason: `status-${response.status}` };
    if (response.url && offlineMediaKey(response.url, appOrigin) !== key) return { ok: false, reason: "final-url" };
    if (response.headers.has("content-range")) return { ok: false, reason: "content-range" };
    const type = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (type !== "video/mp4") return { ok: false, reason: "type" };
    const encoding = (response.headers.get("content-encoding") ?? "identity").trim().toLowerCase();
    if (encoding !== "identity") return { ok: false, reason: "encoding" };
    const lengthHeader = response.headers.get("content-length");
    let declared: number | null = null;
    if (lengthHeader !== null) {
      if (!/^\d+$/.test(lengthHeader.trim())) return { ok: false, reason: "length" };
      declared = Number(lengthHeader);
      if (!Number.isSafeInteger(declared) || declared <= 0 || declared > limit) return { ok: false, reason: "too-large" };
    }
    if (!response.body) return { ok: false, reason: "no-body" };
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit || (declared !== null && total > declared)) { await reader.cancel().catch(() => undefined); return { ok: false, reason: "overrun" }; }
      chunks.push(value);
    }
    if (total === 0) return { ok: false, reason: "empty" };
    if (declared !== null && total !== declared) return { ok: false, reason: "length-mismatch" };
    return { ok: true, blob: new Blob(chunks as BlobPart[], { type: "video/mp4" }), bytes: total };
  } catch (error) {
    return { ok: false, reason: controller.signal.aborted ? "aborted" : error instanceof Error ? error.name : "network" };
  } finally {
    clearTimeout(timer); options.signal?.removeEventListener("abort", abort); release();
  }
}

// ---------- Offline program ----------
/** Offline program: only native rows whose own source is ready; YouTube/uncached skipped immediately. */
export function offlineProgram(rows: readonly TVVideo[], readyKeys: ReadonlySet<string>, appOrigin: string): TVVideo[] {
  return rows.filter(row => {
    if (row.source_type === "youtube") return false;
    const key = offlineMediaKey(row.url, appOrigin);
    return !!key && readyKeys.has(key);
  }).map(row => {
    // A cached primary must not switch to an uncached fallback while offline.
    const fallback = offlineMediaKey(row.fallback_url, appOrigin);
    return row.fallback_url && !(fallback && readyKeys.has(fallback)) ? { ...row, fallback_url: null } : row;
  });
}
