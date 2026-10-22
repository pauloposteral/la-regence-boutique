import { describe, expect, it } from "vitest";
import { checkoutTotals } from "../../supabase/functions/_shared/checkoutAmounts";
import { pixPrice } from "./money";

// BAM-181: client and server share one cent rule; cases reported by independent review.
describe("Pix 10% parity client/server (shared cents rule)", () => {
  const cases: Array<[number, number]> = [[23.65, 21.28], [10.35, 9.31], [21.15, 19.03], [21.95, 19.75]];
  it.each(cases)("subtotal %s -> total %s on both sides", (sub, total) => {
    const t = checkoutTotals(sub, 0, 0, true);
    expect(t.total).toBe(total);
    expect(pixPrice(sub)).toBe(total);
  });
});
