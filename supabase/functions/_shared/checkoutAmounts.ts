/** Existing database amounts are reais; Stripe receives integer centavos once. */
export function requireAmount(value: unknown): number {
  if (typeof value !== "number" && (typeof value !== "string" || !/^\d+(?:\.\d+)?$/.test(value))) throw new Error("Valor monetário inválido");
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > Number.MAX_SAFE_INTEGER / 100) throw new Error("Valor monetário inválido");
  return amount;
}

/** Allocate the exact discounted merchandise total, never round each unit twice. */
export function allocateCheckoutCents(lines: { unitPrice: number; quantidade: number }[], merchandiseTotal: number): number[] {
  const weights = lines.map((line) => {
    if (!Number.isSafeInteger(line.quantidade) || line.quantidade <= 0) throw new Error("Quantidade inválida");
    return requireAmount(line.unitPrice) * line.quantidade;
  });
  const target = Math.round(requireAmount(merchandiseTotal) * 100);
  const sum = weights.reduce((acc, value) => acc + value, 0);
  if (sum <= 0 || target > Math.round(sum * 100)) throw new Error("Total inválido");
  const exact = weights.map((weight) => target * weight / sum);
  const amounts = exact.map(Math.floor);
  let remainder = target - amounts.reduce((acc, value) => acc + value, 0);
  const order = exact.map((value, index) => ({ index, fraction: value - amounts[index] })).sort((a, b) => b.fraction - a.fraction);
  for (const row of order) { if (remainder <= 0) break; amounts[row.index] += 1; remainder -= 1; }
  return amounts;
}