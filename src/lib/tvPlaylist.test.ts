import { describe, it, expect } from "vitest";
import { validateVideoFile, nextVideoId, playableVideos, type TVVideo } from "./tvPlaylist";

const video = (id: string, order: number, active = true): TVVideo => ({
  id, title: id, url: `https://example.com/${id}.mp4`, storage_path: null,
  sort_order: order, active, archived_at: null, fit: "contain",
});

describe("TV playlist", () => {
  it("plays duplicate file sources once, keeping the first ordered active row", () => {
    const original=video('original',2);
    const duplicate={...video('copy',3),url:original.url+'#preview'};
    const archived={...video('archive',0),url:original.url,archived_at:'2026-01-01'};
    expect(playableVideos([duplicate,archived,original]).map(v=>v.id)).toEqual(['original']);
  });
  it("plays a YouTube ID once even when registered with different links", () => {
    const first={...video('youtube',1),source_type:'youtube' as const,youtube_id:'M7lc1UVf-VE',url:'https://youtu.be/M7lc1UVf-VE'};
    const copy={...first,id:'short',sort_order:2,url:'https://youtube.com/shorts/M7lc1UVf-VE'};
    expect(playableVideos([copy,first]).map(v=>v.id)).toEqual(['youtube']);
  });
  it("preserves distinct files with meaningful URL query parameters", () => {
    expect(playableVideos([{...video('a',0),url:'https://example.com/video?id=a'},{...video('b',1),url:'https://example.com/video?id=b'}])).toHaveLength(2);
  });
  it("excludes inactive/archived files and keeps deterministic presentation order", () => {
    const archived = { ...video("old", 0), archived_at: "2026-01-01" };
    expect(playableVideos([video("b", 2), video("off", 0, false), archived, video("a", 1)]).map(v => v.id)).toEqual(["a", "b"]);
  });
  it("wraps the playlist and skips failed files", () => {
    expect(nextVideoId([video("a", 1), video("b", 2), video("c", 3)], "c", new Set(["a"]))).toBe("b");
  });
  it("replays a single item after it ends", () => {
    expect(nextVideoId([video("a", 1)], "a")).toBe("a");
  });
  it("returns no item when all files failed instead of spinning", () => {
    expect(nextVideoId([video("a", 1)], "a", new Set(["a"]))).toBeNull();
    expect(nextVideoId([], "missing")).toBeNull();
  });
});

describe("video upload validation", () => {
  it("accepts a TV-friendly MP4 and rejects empty, unsupported and oversized uploads", () => {
    expect(validateVideoFile({ name: "cafe.mp4", type: "video/mp4", size: 1024 })).toBeNull();
    expect(validateVideoFile({ name: "cafe.mp4", type: "video/mp4", size: 0 })).toMatch(/vazio/);
    expect(validateVideoFile({ name: "cafe.mov", type: "video/quicktime", size: 1024 })).toMatch(/MP4/);
    expect(validateVideoFile({ name: "cafe.mp4", type: "video/mp4", size: 52_428_801 })).toMatch(/50 MB/);
    expect(validateVideoFile({ name: "script.html", type: "text/html", size: 1024 })).toMatch(/MP4/);
  });
});
