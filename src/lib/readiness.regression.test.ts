import { afterEach, describe, expect, it, vi } from "vitest";
import { consumeOAuthNext, storeOAuthNext } from "./oauth";
import { pixPrice } from "./money";

describe("BAM-181 reproduced edge cases (simulated, no network)", () => {
  afterEach(() => vi.restoreAllMocks());
  it("survives the browser sessionStorage getter throwing before method access", () => {
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => { throw new DOMException("Denied", "SecurityError"); });
    expect(() => storeOAuthNext(() => window.sessionStorage, "/checkout")).not.toThrow();
    expect(consumeOAuthNext(() => window.sessionStorage, "/checkout")).toBe("/checkout");
  });
  it("rounds the 10% Pix discount once before subtracting it at the half-cent boundary", () => {
    expect(pixPrice(0.05)).toBe(0.04);
    expect(pixPrice(69.9)).toBe(62.91);
  });
});