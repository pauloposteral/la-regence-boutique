import { describe, expect, it } from "vitest";
import { safeNext } from "./authRules";
import { oauthCallback, callbackError, storeOAuthNext, consumeOAuthNext } from "./oauth";

describe("OAuth public callback and session-confirmed destinations", () => {
  it("returns checkout through public same-origin callback", () => {
    expect(oauthCallback("https://cafelaregence.com.br", "/checkout")).toBe("https://cafelaregence.com.br/auth?next=%2Fcheckout");
  });
  it.each(["//evil.test", "/\\evil.test", "/%2f%2fevil.test", "/auth", "/auth/child", "/x/../auth", "/checkout\n"])('blocks unsafe redirect %s', (path) => {
    expect(safeNext(path)).toBe("/conta");
  });
  it("preserves safe checkout query and fragment", () => {
    expect(safeNext("/checkout?step=2#pagamento")).toBe("/checkout?step=2#pagamento");
    expect(safeNext("/author")).toBe("/author");
  });
  it("consumes destination once", () => {
    storeOAuthNext(sessionStorage, "/checkout");
    expect(consumeOAuthNext(sessionStorage, "/conta")).toBe("/checkout");
    expect(consumeOAuthNext(sessionStorage, "/conta")).toBe("/conta");
  });
  it("works with Safari storage unavailable", () => {
    const storage = { getItem: () => { throw new Error("SecurityError"); }, removeItem: () => {}, setItem: () => { throw new Error("QuotaExceededError"); } };
    expect(() => storeOAuthNext(storage, "/checkout")).not.toThrow();
    expect(consumeOAuthNext(storage, "/checkout")).toBe("/checkout");
  });
  it("detects provider rejection in query and fragment", () => {
    expect(callbackError("?error=access_denied", "")).toBe("access_denied");
    expect(callbackError("", "#error_description=Access+denied")).toBe("Access denied");
    expect(callbackError("?next=%2Fcheckout", "")).toBeNull();
  });
});