import { describe, expect, it } from "vitest";
import { clampTransitionMs, COOLDOWN_BASE_MS, createPressureTracker, createSourceCooldown, resolvePresentation } from "./tvPlaybackPolicy";
import { fileSourceUrl, videoSourceKey, type TVVideo } from "./tvPlaylist";

const file = { source_type: "file" as const };
describe("presentation policy", () => {
  it.each([["clean", 700, 600, 800], ["light", 950, 800, 1100], ["depth", 900, 800, 1000]] as const)("%s defaults to %i ms and clamps to %i–%i", (profile, def, min, max) => {
    expect(resolvePresentation({ ...file, transition_profile: profile }).durationMs).toBe(def);
    expect(clampTransitionMs(profile, 1)).toBe(min);
    expect(clampTransitionMs(profile, 99_999)).toBe(max);
    expect(resolvePresentation({ ...file, transition_profile: profile, transition_ms: min + 10 }).durationMs).toBe(min + 10);
    expect(clampTransitionMs(profile, Number.NaN)).toBe(def);
  });
  it("defaults unknown or legacy rows safely: clean, neutral, opacity only", () => {
    const p = resolvePresentation({ ...file, transition_profile: "spin3d", palette: "neon", transition_ms: 5000 });
    expect(p).toMatchObject({ profile: "clean", durationMs: 700, palette: "neutral", scale: false, light: false, instant: false });
    expect(resolvePresentation({ source_type: undefined } as never).profile).toBe("clean");
  });
  it.each(["amber", "ruby", "pistachio", "cocoa", "neutral"])("accepts palette %s", palette => {
    expect(resolvePresentation({ ...file, transition_profile: "light", palette }).palette).toBe(palette);
  });
  it("depth scales and light adds a light only when allowed", () => {
    expect(resolvePresentation({ ...file, transition_profile: "depth" })).toMatchObject({ scale: true, light: false });
    expect(resolvePresentation({ ...file, transition_profile: "light" })).toMatchObject({ scale: false, light: true });
  });
  it("protected QR/text suppresses global scale and decorative light; zoom protection suppresses scale", () => {
    expect(resolvePresentation({ ...file, transition_profile: "depth", protect_qr: true })).toMatchObject({ scale: false, light: false, durationMs: 900 });
    expect(resolvePresentation({ ...file, transition_profile: "light", protect_text: true })).toMatchObject({ scale: false, light: false, durationMs: 950 });
    expect(resolvePresentation({ ...file, transition_profile: "depth", protect_zoom: true })).toMatchObject({ scale: false });
  });
  it("YouTube is opacity-only", () => {
    expect(resolvePresentation({ source_type: "youtube", transition_profile: "depth" })).toMatchObject({ scale: false, light: false });
    expect(resolvePresentation({ source_type: "youtube", transition_profile: "light", palette: "ruby" })).toMatchObject({ scale: false, light: false });
  });
  it("reduced motion is instant with no effects", () => {
    expect(resolvePresentation({ ...file, transition_profile: "light" }, { reducedMotion: true })).toMatchObject({ instant: true, durationMs: 0, light: false, scale: false });
  });
  it("measured pressure downgrades to the clean dissolve", () => {
    expect(resolvePresentation({ ...file, transition_profile: "depth", transition_ms: 1000 }, { pressure: true })).toMatchObject({ profile: "clean", durationMs: 700, scale: false, light: false });
  });
});

describe("source cooldown", () => {
  it("is keyed by source, backs off, expires independently and clears on success", () => {
    const c = createSourceCooldown();
    c.fail("file:a", 0);
    expect(c.isCooling("file:a", COOLDOWN_BASE_MS - 1)).toBe(true);
    expect(c.isCooling("file:b", 1)).toBe(false);
    expect(c.isCooling("file:a", COOLDOWN_BASE_MS)).toBe(false);
    expect(c.fail("file:a", COOLDOWN_BASE_MS)).toBe(COOLDOWN_BASE_MS * 3);
    c.fail("file:b", 10);
    expect(c.nextExpiry(20)).toBe(10 + COOLDOWN_BASE_MS);
    c.succeed("file:a");
    expect(c.isCooling("file:a", COOLDOWN_BASE_MS + 1)).toBe(false);
  });
});

describe("pressure tracker", () => {
  it("uses only measured frames and stalls", () => {
    const t = createPressureTracker();
    expect(t.sample(0, 0)).toBe(false);
    expect(t.sample(5, 200)).toBe(false);
    expect(t.sample(60, 400)).toBe(true);
    const s = createPressureTracker();
    expect(s.stall(0)).toBe(false);
    expect(s.stall(120_000)).toBe(false);
    expect(s.stall(130_000)).toBe(true);
  });
});

describe("canonical source identity", () => {
  const v = (url: string, extra: Partial<TVVideo> = {}): TVVideo => ({ id: url, title: "", url, storage_path: null, sort_order: 0, active: true, archived_at: null, fit: "contain", ...extra });
  it("strips only the fragment; query stays significant; the playback URL keeps the fragment", () => {
    expect(videoSourceKey(v("https://EXAMPLE.com:443/a.mp4#t=5"))).toBe(videoSourceKey(v("https://example.com/a.mp4")));
    expect(videoSourceKey(v("https://example.com/a.mp4?v=2"))).not.toBe(videoSourceKey(v("https://example.com/a.mp4")));
    expect(fileSourceUrl("https://example.com/a.mp4#t=5")).toBe("https://example.com/a.mp4#t=5");
    expect(videoSourceKey(v("https://youtu.be/x", { source_type: "youtube", youtube_id: "M7lc1UVf-VE" }))).toBe("youtube:M7lc1UVf-VE");
  });
});
