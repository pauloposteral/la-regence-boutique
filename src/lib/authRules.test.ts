import { describe, it, expect } from "vitest";
import { validateSignup, safeNext, translateAuthError } from "./authRules";

const base = { name: "Ana", email: "ana@x.com", password: "12345678", confirmPassword: "12345678", acceptedTerms: true };

describe("signup rules", () => {
  it("accepts 8-char password", () => expect(validateSignup(base)).toBeNull());
  it("rejects 7-char password", () =>
    expect(validateSignup({ ...base, password: "1234567", confirmPassword: "1234567" })).toMatch(/8 caracteres/));
  it("rejects mismatched confirmation", () => expect(validateSignup({ ...base, confirmPassword: "x2345678" })).toMatch(/coincidem/));
  it("requires terms", () => expect(validateSignup({ ...base, acceptedTerms: false })).toMatch(/Termos/));
});

describe("redirect + errors", () => {
  it("keeps internal path", () => expect(safeNext("/checkout")).toBe("/checkout"));
  it("blocks external path", () => expect(safeNext("//evil.com")).toBe("/conta"));
  it("translates duplicate user", () => expect(translateAuthError("User already registered")).toBe("Este e-mail já está cadastrado"));
});
