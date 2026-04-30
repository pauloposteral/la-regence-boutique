// Loyalty tier system — single source of truth
export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

export interface TierInfo {
  tier: LoyaltyTier;
  label: string;
  min: number;
  max: number | null; // null = unlimited
  color: string; // tailwind text/bg color class
  perks: string[];
}

export const TIERS: TierInfo[] = [
  {
    tier: "bronze",
    label: "Bronze",
    min: 0,
    max: 499,
    color: "text-amber-700",
    perks: ["Acesso à loja", "1 ponto por R$ 1 gasto"],
  },
  {
    tier: "silver",
    label: "Silver",
    min: 500,
    max: 1499,
    color: "text-slate-500",
    perks: ["Frete grátis acima de R$ 100", "Bônus em datas especiais"],
  },
  {
    tier: "gold",
    label: "Gold",
    min: 1500,
    max: 3999,
    color: "text-gold",
    perks: ["Frete grátis sempre", "5% off em todas as compras"],
  },
  {
    tier: "platinum",
    label: "Platinum",
    min: 4000,
    max: null,
    color: "text-brown-deep",
    perks: ["Frete grátis", "10% off sempre", "Acesso antecipado", "Cuppings exclusivos"],
  },
];

export function getTierFromPoints(points: number): TierInfo {
  return [...TIERS].reverse().find((t) => points >= t.min) ?? TIERS[0];
}

export function getNextTier(points: number): TierInfo | null {
  const current = getTierFromPoints(points);
  const idx = TIERS.findIndex((t) => t.tier === current.tier);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

export function getProgressToNext(points: number): { pct: number; remaining: number; next: TierInfo | null } {
  const current = getTierFromPoints(points);
  const next = getNextTier(points);
  if (!next) return { pct: 100, remaining: 0, next: null };
  const range = next.min - current.min;
  const progress = points - current.min;
  return {
    pct: Math.min(100, Math.max(0, (progress / range) * 100)),
    remaining: Math.max(0, next.min - points),
    next,
  };
}
