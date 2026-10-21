import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


const brlFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
/** Display-only: catalog, cart and shipping amounts are in reais, not cents.
 * Accept canonical database decimals; never parse localized strings or hide invalid prices as zero.
 * Keep JSON-LD, CSV, gateway amounts and persisted values numeric/machine-readable.
 */
export function formatBRL(value: unknown): string {
  const amount = typeof value === "number" ? value
    : typeof value === "string" && /^-?\d+(?:\.\d+)?$/.test(value.trim()) ? Number(value.trim())
    : NaN;
  return Number.isFinite(amount) ? brlFormatter.format(amount) : "Preço indisponível";
}
