import { describe, it, expect } from "vitest";
import { allocateCheckoutCents, requireAmount, amountCents, checkoutTotals } from "../../supabase/functions/_shared/checkoutAmounts";

describe("authoritative checkout amount boundary", () => {
  it("rounds decimal half-cent values correctly", () => {
    expect(amountCents(1.005)).toBe(101);
    expect(amountCents(10.075)).toBe(1008);
  });
  it("reconciles reviewed total, Pix discount, coupon and gateway cents including shipping", () => {
    const totals = checkoutTotals(259.5, 25.19, 19.9, true);
    expect(totals).toEqual({ pixDiscount: 23.43, merchandiseTotal: 210.88, total: 230.78 });
    const allocated = allocateCheckoutCents([{ unitPrice: 39.9, quantidade: 3 }, { unitPrice: 69.9, quantidade: 2 }], totals.merchandiseTotal);
    expect(allocated.reduce((a, b) => a + b, 0) + amountCents(19.9)).toBe(amountCents(totals.total));
  });
  it("rejects a coupon exceeding the subtotal", () => {
    expect(() => checkoutTotals(69.9, 70, 0, true)).toThrow("Desconto inválido");
  });
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
import { freeShippingBase, pickFreeShippingRule } from "../../supabase/functions/_shared/checkoutAmounts";

describe("free-shipping policy shared by quote and checkout (base after coupon + Pix)", () => {
  const regras = [{ nome: "Frete grátis Brasil", uf: null, valor_minimo: 150 }];
  it("159.60 by card stays free, by Pix (143.64) is charged", () => {
    expect(freeShippingBase(159.6, 0, false)).toBe(159.6);
    expect(pickFreeShippingRule(regras, freeShippingBase(159.6, 0, false), "SP", 150).free).toBe(true);
    expect(freeShippingBase(159.6, 0, true)).toBe(143.64);
    expect(pickFreeShippingRule(regras, freeShippingBase(159.6, 0, true), "SP", 150).free).toBe(false);
  });
  it("coupon that drops the base below the threshold removes free shipping", () => {
    expect(pickFreeShippingRule(regras, freeShippingBase(160, 15.96, false), "SP", 150).free).toBe(false);
    expect(pickFreeShippingRule(regras, freeShippingBase(170, 10, false), "SP", 150).free).toBe(true);
  });
  it("UF rule and empty-table fallback keep existing thresholds", () => {
    const uf = [{ nome: "SP", uf: "SP", valor_minimo: 100 }, ...regras];
    expect(pickFreeShippingRule(uf, 120, "sp", 150).regra?.nome).toBe("SP");
    expect(pickFreeShippingRule(uf, 120, "RJ", 150).free).toBe(false);
    expect(pickFreeShippingRule([], 149.99, "SP", 150).free).toBe(false);
    expect(pickFreeShippingRule([], 150, "SP", 150).free).toBe(true);
  });
});
