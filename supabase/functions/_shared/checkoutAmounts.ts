/** Existing database amounts are reais; Stripe receives integer centavos once. */
export function requireAmount(value: unknown): number {
  if (typeof value !== "number" && (typeof value !== "string" || !/^\d+(?:\.\d+)?$/.test(value))) throw new Error("Valor monetário inválido");
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > Number.MAX_SAFE_INTEGER / 100) throw new Error("Valor monetário inválido");
  return amount;
}

/** Round decimal reais to cents without binary half-cent drift. */
export function amountCents(value: unknown): number {
  const amount = requireAmount(value);
  const [coefficient, exponent = "0"] = String(amount).split("e");
  const cents = Math.round(Number(`${coefficient}e${Number(exponent) + 2}`));
  if (!Number.isSafeInteger(cents)) throw new Error("Valor monetário inválido");
  return cents;
}

export function checkoutTotals(subtotal: unknown, discount: unknown, shipping: unknown, pix: boolean) {
  const subtotalCents = amountCents(subtotal);
  const discountCents = amountCents(discount);
  if (discountCents > subtotalCents) throw new Error("Desconto inválido");
  const afterCoupon = subtotalCents - discountCents;
  const pixCents = pix ? Math.round(afterCoupon / 10) : 0;
  const merchandiseCents = afterCoupon - pixCents;
  return { pixDiscount: pixCents / 100, merchandiseTotal: merchandiseCents / 100,
    total: (merchandiseCents + amountCents(shipping)) / 100 };
}

/** Allocate the exact discounted merchandise total, never round each unit twice. */
export function allocateCheckoutCents(lines: { unitPrice: number; quantidade: number }[], merchandiseTotal: number): number[] {
  const weights = lines.map((line) => {
    if (!Number.isSafeInteger(line.quantidade) || line.quantidade <= 0) throw new Error("Quantidade inválida");
    return requireAmount(line.unitPrice) * line.quantidade;
  });
  const target = amountCents(merchandiseTotal);
  const sum = weights.reduce((acc, value) => acc + value, 0);
  if (sum <= 0 || target > amountCents(sum)) throw new Error("Total inválido");
  const exact = weights.map((weight) => target * weight / sum);
  const amounts = exact.map(Math.floor);
  let remainder = target - amounts.reduce((acc, value) => acc + value, 0);
  const order = exact.map((value, index) => ({ index, fraction: value - amounts[index] })).sort((a, b) => b.fraction - a.fraction);
  for (const row of order) { if (remainder <= 0) break; amounts[row.index] += 1; remainder -= 1; }
  return amounts;
}
/** Authoritative free-shipping policy shared by quote and checkout: base is merchandise AFTER coupon and Pix. */
export interface FreeShippingRule { nome: string; uf: string | null; valor_minimo: number | string }
export function pickFreeShippingRule(
  regras: FreeShippingRule[],
  base: number,
  uf: string | undefined,
  fallbackMin: number,
): { free: boolean; regra: { nome: string; uf: string | null; valor_minimo: number } | null } {
  if (regras.length === 0) {
    const ok = base >= fallbackMin;
    return { free: ok, regra: ok ? { nome: "Frete grátis Brasil", uf: null, valor_minimo: fallbackMin } : null };
  }
  const ufUp = (uf || "").toUpperCase();
  const aplicaveis = regras
    .filter((r) => !r.uf || r.uf.toUpperCase() === ufUp)
    .filter((r) => base >= requireAmount(r.valor_minimo))
    .sort((a, b) => Number(a.valor_minimo) - Number(b.valor_minimo));
  if (aplicaveis.length === 0) return { free: false, regra: null };
  const r = aplicaveis[0];
  return { free: true, regra: { nome: r.nome, uf: r.uf, valor_minimo: Number(r.valor_minimo) } };
}

/** Free-shipping base used by both server functions. */
export function freeShippingBase(subtotal: unknown, couponDiscount: unknown, pix: boolean): number {
  return checkoutTotals(subtotal, couponDiscount, 0, pix).merchandiseTotal;
}
