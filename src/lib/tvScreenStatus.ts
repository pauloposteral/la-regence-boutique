import type { TVPlaybackSnapshot } from "./tvPlaybackPolicy";

/** Paired-screen credential: one device, heartbeat permission only. Never logged or put in URLs. */
export interface ScreenCredential { deviceId: string; token: string }
export const SCREEN_CREDENTIAL_KEY = "lr-tv-screen-credential-v1";
export const HEARTBEAT_INTERVAL_MS = 15_000;
export const STALE_AFTER_MS = 45_000;
export const SCREEN_LIMITS = { labelMax: 64, devices: 50 } as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TOKEN = /^[0-9a-f]{64}$/;

/** Pairing code shown once in /video/enviar: "<device uuid>.<64 hex token>". */
export const formatPairingCode = (credential: ScreenCredential) => `${credential.deviceId}.${credential.token}`;
export function parsePairingCode(input: unknown): ScreenCredential | null {
  if (typeof input !== "string") return null;
  const [deviceId, token, extra] = input.trim().toLowerCase().split(".");
  return extra === undefined && UUID.test(deviceId ?? "") && TOKEN.test(token ?? "") ? { deviceId, token } : null;
}

type StorageGetter = () => Storage | undefined;
const defaultStorage: StorageGetter = () => window.localStorage;
/** The localStorage getter itself can throw (privacy mode, sandboxed frames). */
function storageOf(get: StorageGetter): Storage | undefined {
  try { return get(); } catch { return undefined; }
}
export function loadCredential(get: StorageGetter = defaultStorage): ScreenCredential | null {
  try { return parsePairingCode(storageOf(get)?.getItem(SCREEN_CREDENTIAL_KEY) ?? null); } catch { return null; }
}
/** "persisted" or "memory" (pairing works now but will not survive reload). */
export function saveCredential(credential: ScreenCredential, get: StorageGetter = defaultStorage): "persisted" | "memory" {
  try {
    const storage = storageOf(get);
    if (!storage) return "memory";
    storage.setItem(SCREEN_CREDENTIAL_KEY, formatPairingCode(credential));
    return storage.getItem(SCREEN_CREDENTIAL_KEY) === formatPairingCode(credential) ? "persisted" : "memory";
  } catch { return "memory"; }
}
export function clearCredential(get: StorageGetter = defaultStorage): void {
  try { storageOf(get)?.removeItem(SCREEN_CREDENTIAL_KEY); } catch { /* nothing persisted */ }
}

export type ReportState = "playing" | "paused" | "buffering" | "blocked" | "error" | "offline";
export interface OfflineReport { revision: string | null; cachedCount: number; eligibleCount: number; cachedBytes: number; savedAt: number | null }

const clampInt = (value: number, min: number, max: number) => Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : min;

/** Map the player's observed media state to the reported enum. Selection intent alone is never "playing". */
export function reportState(snapshot: TVPlaybackSnapshot, offlineMode: boolean): ReportState {
  switch (snapshot.mediaState) {
    case "playing": return "playing";
    case "paused": return "paused";
    case "blocked": return "blocked";
    case "error": return offlineMode ? "offline" : "error";
    case "starting": case "buffering": return "buffering";
    default: return offlineMode ? "offline" : snapshot.currentId ? "buffering" : "paused";
  }
}

/** Typed RPC arguments; values are bounded to the server contract before sending. */
export function buildReport(credential: ScreenCredential, snapshot: TVPlaybackSnapshot, offline: OfflineReport, offlineMode: boolean, now = Date.now()) {
  const revision = offline.revision && /^[0-9a-f]{64}$/.test(offline.revision) ? offline.revision : null;
  return {
    p_device_id: credential.deviceId,
    p_token: credential.token,
    p_state: reportState(snapshot, offlineMode),
    p_current_item: snapshot.currentId && UUID.test(snapshot.currentId) ? snapshot.currentId : null,
    p_last_completed_item: snapshot.lastCompletedId && UUID.test(snapshot.lastCompletedId) ? snapshot.lastCompletedId : null,
    p_position_seconds: Number.isFinite(snapshot.positionSeconds) ? Math.min(86_400, Math.max(0, snapshot.positionSeconds)) : 0,
    p_width: clampInt(snapshot.width, 0, 8192),
    p_height: clampInt(snapshot.height, 0, 8192),
    p_quality_mode: snapshot.qualityMode,
    p_playlist_revision: revision,
    p_cached_count: clampInt(offline.cachedCount, 0, 12),
    p_eligible_count: clampInt(offline.eligibleCount, 0, 100),
    p_cached_bytes: clampInt(offline.cachedBytes, 0, 201_326_592),
    p_snapshot_age_seconds: offline.savedAt === null ? null : clampInt((now - offline.savedAt) / 1000, 0, 315_360_000),
  };
}

// ---------- Admin panel ----------
export interface ScreenRow {
  device_id: string; label: string; created_at: string; revoked_at: string | null;
  last_seen_at: string | null; last_progress_at: string | null; current_item: string | null; last_completed_item: string | null;
  playback_state: string | null; position_seconds: number | null; width: number | null; height: number | null;
  quality_mode: string | null; playlist_revision: string | null; cached_count: number | null; eligible_count: number | null;
  cached_bytes: number | null; snapshot_age_seconds: number | null;
}
export type Connection = "revoked" | "never" | "stale" | "connected";
const STATE_LABELS: Record<string, string> = {
  playing: "Reproduzindo", paused: "Pausado", buffering: "Carregando", blocked: "Aguardando toque para iniciar", error: "Erro de reprodução", offline: "Sem conexão (programa local)",
};
const QUALITY_LABELS: Record<string, string> = { normal: "Normal", compatible: "Compatível", "reduced-motion": "Movimento reduzido" };

/** Connection is derived from server time of the last heartbeat; it never claims the TV is off. */
export function describeScreen(row: ScreenRow, now = Date.now()) {
  const seen = row.last_seen_at ? Date.parse(row.last_seen_at) : NaN;
  const connection: Connection = row.revoked_at ? "revoked" : !Number.isFinite(seen) ? "never" : now - seen > STALE_AFTER_MS ? "stale" : "connected";
  const connectionLabel = { revoked: "Revogada", never: "Ainda sem sinal do navegador", stale: "Sem sinal recente do navegador", connected: "Navegador conectado" }[connection];
  const playback = connection === "connected" && row.playback_state ? STATE_LABELS[row.playback_state] ?? "Desconhecido" : null;
  const progressAt = row.last_progress_at ? Date.parse(row.last_progress_at) : NaN;
  return {
    connection, connectionLabel, playback,
    quality: row.quality_mode ? QUALITY_LABELS[row.quality_mode] ?? null : null,
    resolution: row.width && row.height ? `${row.width}×${row.height}` : null,
    lastSeenAgo: Number.isFinite(seen) ? Math.max(0, Math.round((now - seen) / 1000)) : null,
    lastProgressAgo: Number.isFinite(progressAt) ? Math.max(0, Math.round((now - progressAt) / 1000)) : null,
  };
}

export const formatMiB = (bytes: number) => `${(bytes / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
