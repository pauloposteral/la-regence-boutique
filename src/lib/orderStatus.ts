// Centralized order status definitions — single source of truth
// for labels, colors, ordering, and operational metadata.
import type { Database } from "@/integrations/supabase/types";

export type StatusPedido = Database["public"]["Enums"]["status_pedido"];

/** Customer-facing labels (pt-BR) */
export const STATUS_LABELS: Record<StatusPedido, string> = {
  pendente: "Aguardando pagamento",
  confirmado: "Confirmado",
  pago: "Pago",
  preparando: "Preparando pedido",
  torrando: "Torrando seu café",
  embalando: "Embalando",
  enviado: "Enviado",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

/** Short labels for compact UI (badges, tables) */
export const STATUS_SHORT: Record<StatusPedido, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  pago: "Pago",
  preparando: "Preparando",
  torrando: "Torrando",
  embalando: "Embalando",
  enviado: "Enviado",
  saiu_para_entrega: "Em entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

/** Tailwind classes for admin badges (preserve original color language) */
export const STATUS_COLORS_ADMIN: Record<StatusPedido, string> = {
  pendente: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  confirmado: "bg-blue-100 text-blue-800 border border-blue-200",
  pago: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  preparando: "bg-orange-100 text-orange-800 border border-orange-200",
  torrando: "bg-amber-100 text-amber-800 border border-amber-200",
  embalando: "bg-cyan-100 text-cyan-800 border border-cyan-200",
  enviado: "bg-purple-100 text-purple-800 border border-purple-200",
  saiu_para_entrega: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  entregue: "bg-green-100 text-green-800 border border-green-200",
  cancelado: "bg-red-100 text-red-800 border border-red-200",
  reembolsado: "bg-rose-100 text-rose-800 border border-rose-200",
};

/** Tailwind classes for customer-facing badges (uses brand tokens) */
export const STATUS_COLORS_CUSTOMER: Record<StatusPedido, string> = {
  pendente: "bg-muted text-muted-foreground",
  confirmado: "bg-accent/10 text-accent",
  pago: "bg-accent/15 text-accent",
  preparando: "bg-accent/20 text-accent",
  torrando: "bg-gold/15 text-gold-dark border border-gold/30",
  embalando: "bg-accent/25 text-accent",
  enviado: "bg-primary/10 text-primary",
  saiu_para_entrega: "bg-primary/15 text-primary",
  entregue: "bg-green-100 text-green-700",
  cancelado: "bg-destructive/10 text-destructive",
  reembolsado: "bg-rose-100 text-rose-700",
};

/** Happy-path order timeline (used by progress UI) */
export const STATUS_TIMELINE: StatusPedido[] = [
  "pendente",
  "pago",
  "torrando",
  "embalando",
  "enviado",
  "saiu_para_entrega",
  "entregue",
];

/** Terminal states — order won't progress further */
export const STATUS_TERMINAL: StatusPedido[] = ["entregue", "cancelado", "reembolsado"];

/** All values for admin Select dropdown (logical ordering) */
export const STATUS_OPTIONS: StatusPedido[] = [
  "pendente",
  "confirmado",
  "pago",
  "preparando",
  "torrando",
  "embalando",
  "enviado",
  "saiu_para_entrega",
  "entregue",
  "cancelado",
  "reembolsado",
];

/**
 * Returns 0..1 progress for the timeline bar.
 * Cancelled / refunded orders return 0 (timeline irrelevant).
 */
export function getStatusProgress(status: StatusPedido): number {
  if (STATUS_TERMINAL.includes(status) && status !== "entregue") return 0;
  const idx = STATUS_TIMELINE.indexOf(status);
  if (idx === -1) return 0;
  return idx / (STATUS_TIMELINE.length - 1);
}

/** Whether a status is part of the happy path (excludes cancel/refund) */
export function isOnTimeline(status: StatusPedido): boolean {
  return STATUS_TIMELINE.includes(status);
}
