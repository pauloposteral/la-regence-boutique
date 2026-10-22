import { describe, expect, it } from "vitest";
import config from "../../tailwind.config";

// BAM-181 residual-risk guard for GHSA-vfj7-8cjw-p6xm (braces <=3.0.3, no fixed release):
// braces only expands Tailwind's own static content globs at build/dev time. Keep them
// literal, shallow and short so no deeply nested pattern can reach the expander.
function braceDepth(glob: string): number {
  let depth = 0, max = 0;
  for (const ch of glob) {
    if (ch === "{") max = Math.max(max, ++depth);
    if (ch === "}") depth--;
  }
  return max;
}

describe("Tailwind content globs stay trusted and shallow", () => {
  const content = (config as { content: unknown }).content;
  it("is a static list of string globs", () => {
    expect(Array.isArray(content)).toBe(true);
    for (const g of content as unknown[]) expect(typeof g).toBe("string");
  });
  it.each(content as string[])("%s has brace depth <= 1 and bounded length", (glob) => {
    expect(braceDepth(glob)).toBeLessThanOrEqual(1);
    expect(glob.length).toBeLessThan(80);
  });
});
