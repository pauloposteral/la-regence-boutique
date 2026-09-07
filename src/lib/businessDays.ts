// Cálculo de dias úteis (feriados nacionais BR, fuso America/Sao_Paulo).
// Espelha supabase/functions/_shared/businessDays.ts — mantenha os dois em sincronia.

export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

export function nationalHolidays(year: number): Set<string> {
  const easter = easterSunday(year);
  return new Set([
    `${year}-01-01`,
    `${year}-04-21`,
    `${year}-05-01`,
    `${year}-09-07`,
    `${year}-10-12`,
    `${year}-11-02`,
    `${year}-11-15`,
    `${year}-11-20`,
    `${year}-12-25`,
    iso(addDays(easter, -48)),
    iso(addDays(easter, -47)),
    iso(addDays(easter, -2)),
    iso(addDays(easter, 60)),
  ]);
}

const cache = new Map<number, Set<string>>();
const holidaysFor = (y: number) => {
  let h = cache.get(y);
  if (!h) { h = nationalHolidays(y); cache.set(y, h); }
  return h;
};

export function saoPauloDateString(when: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(when);
}

const parseISODate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

export function isBusinessDay(dateStr: string): boolean {
  const d = parseISODate(dateStr);
  const dow = d.getUTCDay();
  if (dow === 0 || dow === 6) return false;
  return !holidaysFor(d.getUTCFullYear()).has(dateStr);
}

export function shipByDate(from: Date = new Date(), businessDays = 3): string {
  let cursor = parseISODate(saoPauloDateString(from));
  let counted = 0;
  while (counted < businessDays) {
    cursor = addDays(cursor, 1);
    if (isBusinessDay(iso(cursor))) counted++;
  }
  return iso(cursor);
}

const WEEKDAYS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

export function formatShipBy(dateStr: string): string {
  const d = parseISODate(dateStr);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${WEEKDAYS[d.getUTCDay()]}, ${dd}/${mm}`;
}

export function isOverdue(dateStr: string, now: Date = new Date()): boolean {
  return dateStr < saoPauloDateString(now);
}

export function shipStatus(dateStr?: string | null, now: Date = new Date()): "none" | "ok" | "today" | "late" {
  if (!dateStr) return "none";
  const today = saoPauloDateString(now);
  if (dateStr < today) return "late";
  if (dateStr === today) return "today";
  return "ok";
}

/** Formata o endereço guardado na assinatura/ciclo em uma linha legível. */
export function formatEndereco(e: any): string {
  if (!e) return "";
  const parts = [
    `${e.logradouro || ""}, ${e.numero || "s/n"}${e.complemento ? ` — ${e.complemento}` : ""}`,
    e.bairro,
    `${e.cidade || ""}/${e.estado || ""}`,
    e.cep ? `CEP ${e.cep}` : "",
  ].filter(Boolean);
  return parts.join(" · ");
}
