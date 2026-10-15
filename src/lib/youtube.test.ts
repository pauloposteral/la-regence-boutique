import { describe, expect, it } from "vitest";
import { parseYouTubeUrl } from "./youtube";

describe("YouTube programming links", () => {
  it.each([
    "https://www.youtube.com/watch?v=M7lc1UVf-VE&feature=share",
    "https://youtu.be/M7lc1UVf-VE?si=share",
    "https://m.youtube.com/shorts/M7lc1UVf-VE",
    "https://www.youtube.com/embed/M7lc1UVf-VE",
    "https://youtube.com/live/M7lc1UVf-VE",
    "youtu.be/M7lc1UVf-VE",
  ])("extracts one canonical video from %s", url => {
    expect(parseYouTubeUrl(url)).toEqual({ id: "M7lc1UVf-VE", url: "https://www.youtube.com/watch?v=M7lc1UVf-VE" });
  });
  it.each([
    "javascript:alert(1)", "https://youtube.com.evil.test/watch?v=M7lc1UVf-VE",
    "https://evil.test/youtube.com/watch?v=M7lc1UVf-VE", "https://youtube.com/playlist?list=abc",
    "https://youtube.com/watch?v=bad", "https://youtu.be/M7lc1UVf-VE/extra", "", "not a link",
  ])("rejects unsupported or unsafe input %s", url => { expect(parseYouTubeUrl(url)).toBeNull(); });
});
