import { describe, it, expect } from "vitest";
import { allocateCheckoutCents, requireAmount } from "../../supabase/functions/_shared/checkoutAmounts";

describe("authoritative checkout amount boundary", () => {
  it("charges actual 69.90 offer with 10% Pix as 6291 cents exactly", () => {
    expect(allocateCheckoutCents([{ unitPrice: 69.9, quantidade: 1 }], 62.91)).toEqual([6291]);
  });
  it("allocates coupon and Pix without twice-rounded units changing the total", () => {
    const lines = [{ unitPrice: 39.9, quantidade: 3 }, { unitPrice: 69.9, quantidade: 2 }];
    const cents = allocateCheckoutCents(lines, 210.87);
    expect(cents.reduce((a, b) => a + b, 0)).toBe(21087);
  });
  it.each([null, "", "bad", NaN, Infinity, -1])("rejects invalid persisted or quoted amount %s", (value) => {
    expect(() => requireAmount(value)).toThrow();
  });
  it("rejects invalid quantity before constructing payment", () => {
    expect(() => allocateCheckoutCents([{ unitPrice: 39.9, quantidade: 0 }], 0)).toThrow();
  });
});