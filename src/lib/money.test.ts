import { describe, it, expect } from "vitest";
import { formatBRL, moneyValue, fromCents, effectivePrice, pixPrice, variantPromo, roundMoney } from "./money";

describe("BRL in reais; explicit Stripe centavos boundary", () => {
  it("formats reais with decimal comma and grouping", () => {
    expect(formatBRL(1234.56)).toBe("R$\u00a01.234,56");
    expect(formatBRL("39.90")).toBe("R$\u00a039,90");
    expect(formatBRL(0)).toBe("R$\u00a00,00");
    expect(formatBRL(-19.9)).toBe("-R$\u00a019,90");
  });
  it("converts centavos only when explicitly requested", () => {
    expect(fromCents(5990)).toBe(59.9);
    expect(formatBRL(5990)).toBe("R$\u00a05.990,00");
    expect(() => fromCents(59.9)).toThrow();
  });
  it.each([null, undefined, "", " ", "39,90", "R$ 39.90", NaN, Infinity, {}, true])("never masks invalid money %s", (value) => {
    expect(() => moneyValue(value)).toThrow();
    expect(formatBRL(value)).toBe("Valor inválido");
  });
  it("applies 10% Pix after the actual database offer, not before", () => {
    expect(effectivePrice(79.9, 69.9)).toBe(69.9);
    expect(pixPrice(79.9, 69.9)).toBe(62.91);
    expect(pixPrice(39.9)).toBe(35.91);
  });
  it("scales a promotional variant once and keeps the original reais", () => {
    expect(variantPromo(79.9, 69.9, 159.8)).toBe(139.8);
    expect(variantPromo(79.9, null, 159.8)).toBeUndefined();
    expect(pixPrice(159.8, 139.8)).toBe(125.82);
    expect(variantPromo(79.9, 69.9, 69.9)).toBe(69.9);
  });
  it("rejects invalid offers rather than falling back to base", () => {
    expect(() => effectivePrice(79.9, "bad")).toThrow();
    expect(() => effectivePrice(79.9, 90)).toThrow();
    expect(effectivePrice(79.9, 0)).toBe(0);
  });
  it("rounds arithmetic once to currency precision", () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(69.9 / 12)).toBe(5.83);
  });
});