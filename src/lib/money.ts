/** Database, cart and shipping amounts are BRL reais. Stripe alone uses centavos. */
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Accept numeric DB strings, but never interpret localized text, null or blanks as zero. */
export function moneyValue(value: unknown): number {
  if (typeof value !== "number" && typeof value !== "string") throw new TypeError("Valor monetário inválido");
  if (typeof value === "string" && !/^-?\d+(?:\.\d+)?$/.test(value)) throw new TypeError("Valor monetário inválido");
  const amount = Number(value);
  if (!Number.isFinite(amount) || Math.abs(amount) > Number.MAX_SAFE_INTEGER / 100) throw new RangeError("Valor monetário inválido");
  return amount;
}

/** Invalid data stays visible instead of becoming a fictitious free/zero price. */
export function formatBRL(value: unknown): string {
  try { return brl.format(moneyValue(value)); }
  catch { return "Valor inválido"; }
}

export function roundMoney(value: unknown): number {
  const amount = moneyValue(value);
  return Math.sign(amount) * Math.round((Math.abs(amount) + Number.EPSILON) * 100) / 100;
}

export function fromCents(value: unknown): number {
  const cents = moneyValue(value);
  if (!Number.isSafeInteger(cents)) throw new TypeError("Centavos inválidos");
  return cents / 100;
}

export function effectivePrice(base: unknown, promo?: unknown): number {
  const price = moneyValue(base);
  if (price < 0) throw new RangeError("Preço inválido");
  if (promo == null) return price;
  const offer = moneyValue(promo);
  if (offer < 0 || offer > price) throw new RangeError("Preço promocional inválido");
  return offer;
}

export function pixPrice(base: unknown, promo?: unknown): number {
  return roundMoney(effectivePrice(base, promo) * 0.9);
}

export function variantPromo(base: unknown, promo: unknown, variant: unknown): number | undefined {
  const price = moneyValue(base);
  const selected = moneyValue(variant);
  if (price <= 0 || selected < 0) throw new RangeError("Preço inválido");
  return promo == null ? undefined : roundMoney(selected * effectivePrice(base, promo) / price);
}