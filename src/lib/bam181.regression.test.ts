import { describe, expect, it } from "vitest";
import * as utils from "./utils";
import { safeNext, translateAuthError } from "./authRules";

type MoneyUtils = { formatBRL: (value: unknown) => string };
const format = (value: unknown) => {
  expect(utils).toHaveProperty("formatBRL");
  return (utils as unknown as MoneyUtils).formatBRL(value).replace(/\u00a0/g, " ");
};

describe("BAM-181: prices are reais, never implicitly cents", () => {
  it.each([
    [1234.56, "R$ 1.234,56"], [39.9, "R$ 39,90"], [0, "R$ 0,00"],
    [123456, "R$ 123.456,00"], ["1234.56", "R$ 1.234,56"],
    [" 39.90 ", "R$ 39,90"], [2.675, "R$ 2,68"], [-12.5, "-R$ 12,50"],
  ])("formats %s without changing units", (value, expected) => {
    expect(format(value)).toBe(expected);
  });
  it.each([null, undefined, "", "   ", "R$ 39,90", "39,90", "1.234,56", "12oops", NaN, Infinity, -Infinity, {}, true])("does not disguise invalid %s as a free product", (value) => {
    expect(format(value)).toBe("Preço indisponível");
  });
});

describe("BAM-181: safe post-login destination", () => {
  it.each(["//evil.example", "/\\evil.example", "/%5cevil.example", "/%2f%2fevil.example", "/\nevil.example", "https://evil.example", "/auth", "/a/../auth", "/%61uth", "/auth?next=/checkout"])("rejects %s", (value) => {
    expect(safeNext(value)).toBe("/conta");
  });
  it.each(["/checkout", "/checkout?cupom=CAFE", "/cafes#catalogo", "/conta"])("preserves %s", (value) => {
    expect(safeNext(value)).toBe(value);
  });
  it("explains an unavailable provider without exposing configuration", () => {
    expect(translateAuthError("Unsupported provider: missing OAuth secret")).toBe("O login com Google está indisponível no momento. Entre com e-mail e senha.");
  });
});
