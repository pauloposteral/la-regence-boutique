import type { TVVideo } from "./tvPlaylist";

/** Approved transition profiles: default and inclusive range in milliseconds. */
export const TRANSITION_PROFILES = {
  clean: { label: "Dissolução limpa", defaultMs: 700, minMs: 600, maxMs: 800 },
  light: { label: "Luz na cor da paleta", defaultMs: 950, minMs: 800, maxMs: 1100 },
  depth: { label: "Profundidade sutil", defaultMs: 900, minMs: 800, maxMs: 1000 },
} as const;
export type TransitionProfile = keyof typeof TRANSITION_PROFILES;

export const PALETTES = {
  amber: { label: "Âmbar", rgb: "255,190,110" },
  ruby: { label: "Rubi", rgb: "200,70,90" },
  pistachio: { label: "Pistache", rgb: "170,205,130" },
  cocoa: { label: "Cacau", rgb: "160,105,70" },
  neutral: { label: "Neutra", rgb: "255,238,215" },
} as const;
export type Palette = keyof typeof PALETTES;

export interface PresentationSettings {
  transition_profile?: string | null;
  transition_ms?: number | null;
  palette?: string | null;
  protect_qr?: boolean | null;
  protect_text?: boolean | null;
  protect_zoom?: boolean | null;
}

export interface ResolvedPresentation {
  profile: TransitionProfile;
  durationMs: number;
  palette: Palette;
  /** Global scale (depth) is allowed. */
  scale: boolean;
  /** Decorative palette light overlay is allowed. */
  light: boolean;
  /** No visual handoff at all (reduced motion). */
  instant: boolean;
  /** Why effects were reduced, for operator-facing summaries. */
  reasons: string[];
}

export interface PresentationContext { reducedMotion?: boolean; pressure?: boolean }

export const isProfile = (value: unknown): value is TransitionProfile => typeof value === "string" && value in TRANSITION_PROFILES;
export const isPalette = (value: unknown): value is Palette => typeof value === "string" && value in PALETTES;

export function clampTransitionMs(profile: TransitionProfile, ms?: number | null): number {
  const range = TRANSITION_PROFILES[profile];
  if (typeof ms !== "number" || !Number.isFinite(ms)) return range.defaultMs;
  return Math.min(range.maxMs, Math.max(range.minMs, Math.round(ms)));
}

/** Single policy used by the live player and the admin preview. */
export function resolvePresentation(video: Pick<TVVideo, "source_type"> & PresentationSettings, context: PresentationContext = {}): ResolvedPresentation {
  const reasons: string[] = [];
  let profile: TransitionProfile = isProfile(video.transition_profile) ? video.transition_profile : "clean";
  const palette: Palette = isPalette(video.palette) ? video.palette : "neutral";
  const protectedContent = !!video.protect_qr || !!video.protect_text;
  let scale = profile === "depth";
  let light = profile === "light";
  if (video.source_type === "youtube") { scale = false; light = false; reasons.push("YouTube: somente opacidade"); }
  if (protectedContent) { scale = false; light = false; reasons.push(video.protect_qr ? "QR protegido" : "Texto protegido"); }
  if (video.protect_zoom && scale) { scale = false; reasons.push("Sem zoom"); }
  if (context.pressure && (scale || light || profile !== "clean")) {
    scale = false; light = false; profile = "clean"; reasons.push("Efeito reduzido pela reprodução medida");
  }
  const durationMs = clampTransitionMs(profile, profile === video.transition_profile ? video.transition_ms : null);
  if (context.reducedMotion) return { profile, durationMs: 0, palette, scale: false, light: false, instant: true, reasons: [...reasons, "Movimento reduzido"] };
  return { profile, durationMs, palette, scale, light, instant: false, reasons };
}

export function describePresentation(p: ResolvedPresentation): string {
  if (p.instant) return "Troca direta (movimento reduzido)";
  const base = `${TRANSITION_PROFILES[p.profile].label} · ${p.durationMs} ms${p.light ? ` · ${PALETTES[p.palette].label}` : ""}`;
  return p.reasons.length ? `${base} · ${p.reasons.join(" · ")}` : base;
}

/** Source-scoped failure cooldown keyed by canonical source identity. Survives
 *  polling and reorders because rows and positions are not part of the key. */
export interface SourceCooldown {
  fail(key: string, now?: number): number;
  succeed(key: string): void;
  isCooling(key: string, now?: number): boolean;
  nextExpiry(now?: number): number | null;
  clear(): void;
}
export const COOLDOWN_BASE_MS = 60_000;
export const COOLDOWN_MAX_MS = 10 * 60_000;
export function createSourceCooldown(): SourceCooldown {
  const entries = new Map<string, { until: number; failures: number }>();
  return {
    fail(key, now = Date.now()) {
      const failures = (entries.get(key)?.failures ?? 0) + 1;
      const until = now + Math.min(COOLDOWN_MAX_MS, COOLDOWN_BASE_MS * 2 ** (failures - 1));
      entries.set(key, { until, failures });
      return until;
    },
    succeed(key) { entries.delete(key); },
    isCooling(key, now = Date.now()) { const entry = entries.get(key); return !!entry && entry.until > now; },
    nextExpiry(now = Date.now()) {
      let next: number | null = null;
      for (const { until } of entries.values()) if (until > now && (next === null || until < next)) next = until;
      return next;
    },
    clear() { entries.clear(); },
  };
}

/** Measured playback pressure: dropped decoded frames or repeated stalls. It
 *  never relies on capability estimates. Once detected it stays on for the session. */
export function createPressureTracker({ minFrames = 120, dropRatio = 0.1, stallLimit = 2, stallWindowMs = 60_000 } = {}) {
  let base: { dropped: number; total: number } | null = null;
  const stalls: number[] = [];
  let pressure = false;
  return {
    get pressure() { return pressure; },
    sample(dropped: number, total: number) {
      if (!Number.isFinite(dropped) || !Number.isFinite(total)) return pressure;
      if (!base || total < base.total) base = { dropped, total };
      const frames = total - base.total;
      if (frames >= minFrames) {
        if ((dropped - base.dropped) / frames > dropRatio) pressure = true;
        base = { dropped, total };
      }
      return pressure;
    },
    stall(now = Date.now()) {
      stalls.push(now);
      while (stalls.length && now - stalls[0] > stallWindowMs) stalls.shift();
      if (stalls.length >= stallLimit) pressure = true;
      return pressure;
    },
  };
}

/** Task 2 extension point: bounded snapshot of what the player is actually doing. */
export interface TVPlaybackSnapshot {
  currentId: string | null;
  sourceKey: string | null;
  state: "playing" | "paused" | "blocked" | "idle";
  reducedEffects: boolean;
}
