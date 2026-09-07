// Cálculo de dias úteis no fuso America/Sao_Paulo com feriados nacionais
// (fixos + móveis derivados da Páscoa). Usado para o prazo de despacho.

/** Domingo de Páscoa (algoritmo de Meeus/Butcher) em UTC-midnight. */
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
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = março, 4 = abril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDaysUTC(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86400000);
}

/** Feriados nacionais brasileiros (YYYY-MM-DD) para um ano. */
export function nationalHolidays(year: number): Set<string> {
  const easter = easterSunday(year);
  const fixed = [
    `${year}-01-01`, // Confraternização Universal
    `${year}-04-21`, // Tiradentes
    `${year}-05-01`, // Dia do Trabalho
    `${year}-09-07`, // Independência
    `${year}-10-12`, // Nossa Senhora Aparecida
    `${year}-11-02`, // Finados
    `${year}-11-15`, // Proclamação da República
    `${year}-11-20`, // Consciência Negra (nacional desde 2024)
    `${year}-12-25`, // Natal
  ];
  const movable = [
    iso(addDaysUTC(easter, -48)), // Segunda de Carnaval
    iso(addDaysUTC(easter, -47)), // Terça de Carnaval
    iso(addDaysUTC(easter, -2)), // Sexta-feira Santa
    iso(addDaysUTC(easter, 60)), // Corpus Christi
  ];
  return new Set([...fixed, ...movable]);
}

const holidayCache = new Map<number, Set<string>>();
function holidaysFor(year: number): Set<string> {
  let h = holidayCache.get(year);
  if (!h) {
    h = nationalHolidays(year);
    holidayCache.set(year, h);
  }
  return h;
}

/** Data (YYYY-MM-DD) no fuso America/Sao_Paulo para um instante qualquer. */
export function saoPauloDateString(when: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(when);
}

function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function isBusinessDay(dateStr: string): boolean {
  const d = parseISODate(dateStr);
  const dow = d.getUTCDay();
  if (dow === 0 || dow === 6) return false;
  return !holidaysFor(d.getUTCFullYear()).has(dateStr);
}

/**
 * Data-limite de despacho: N dias úteis contados a partir do PRÓXIMO dia útil
 * após `from` (sem horário de corte — RN-011 / DP-11).
 */
export function shipByDate(from: Date = new Date(), businessDays = 3): string {
  let cursor = parseISODate(saoPauloDateString(from));
  let counted = 0;
  while (counted < businessDays) {
    cursor = addDaysUTC(cursor, 1);
    if (isBusinessDay(iso(cursor))) counted++;
  }
  return iso(cursor);
}

const WEEKDAYS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

/** "quinta-feira, 10/09" — data absoluta por extenso (RN-005). */
export function formatShipBy(dateStr: string): string {
  const d = parseISODate(dateStr);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${WEEKDAYS[d.getUTCDay()]}, ${dd}/${mm}`;
}

/** true quando a data-limite já passou (comparado no fuso de São Paulo). */
export function isOverdue(dateStr: string, now: Date = new Date()): boolean {
  return dateStr < saoPauloDateString(now);
}
