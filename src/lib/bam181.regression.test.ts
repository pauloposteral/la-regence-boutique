import { describe, expect, it } from "vitest";
import { formatBRL, effectivePrice, pixPrice, variantPromo } from "./money";
import { safeNext } from "./authRules";
import { oauthCallback, callbackError, consumeOAuthNext } from "./oauth";

const display = (value: unknown) => formatBRL(value).replace(/\u00a0/g, " ");
describe("BAM-181 independent BRL regression", () => {
  it.each([[1234.56,"R$ 1.234,56"],[0,"R$ 0,00"],[39.9,"R$ 39,90"],[123456,"R$ 123.456,00"],["1234.56","R$ 1.234,56"],[2.675,"R$ 2,68"],[-12.5,"-R$ 12,50"]])("formats %s in reais", (value, expected) => expect(display(value)).toBe(expected));
  it.each([null,undefined,""," ","R$ 39,90","39,90","1.234,56","12oops",NaN,Infinity,-Infinity,{},true])("never presents invalid %s as free", value => {
    expect(display(value)).not.toMatch(/R\$|NaN|Infinity/);
    expect(display(value)).toMatch(/inválido|indisponível/i);
  });
  it("keeps promotion, Pix and selected legacy variant consistent", () => {
    expect(display(effectivePrice(79.9,69.9))).toBe("R$ 69,90");
    expect(display(pixPrice(79.9,69.9))).toBe("R$ 62,91");
    expect(variantPromo(79.9,69.9,69.9)).toBe(69.9);
    expect(variantPromo(79.9,69.9,159.8)).toBe(139.8);
  });
});
describe("BAM-181 independent OAuth regression", () => {
  it.each(["//evil.example","/\\evil.example","/%5cevil.example","/%2f%2fevil.example","/\nevil.example","https://evil.example","/auth","/a/../auth","/%61uth","/auth?next=/checkout"])("rejects %s", value => expect(safeNext(value)).toBe("/conta"));
  it.each(["/checkout","/checkout?cupom=CAFE","/cafes#catalogo","/conta"])("preserves %s", value => expect(safeNext(value)).toBe(value));
  it("preserves checkout in public callback", () => expect(oauthCallback("https://cafelaregence.com.br","/checkout")).toBe("https://cafelaregence.com.br/auth?next=%2Fcheckout"));
  it("handles denied consent without a fake session", () => expect(callbackError("?error=access_denied","")).toBe("access_denied"));
  it("works when Safari storage methods reject access", () => {
    const storage={getItem:()=>{throw new Error("SecurityError");},removeItem:()=>{throw new Error("SecurityError");}};
    expect(consumeOAuthNext(storage,"/checkout")).toBe("/checkout");
  });
});
