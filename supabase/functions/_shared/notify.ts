// Serviço único de notificações: envia via send-email, registra em
// notification_log e reenvia com backoff quando falha (RN-006/RN-007).
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";

let _admin: SupabaseClient | null = null;
export function adminClient(): SupabaseClient {
  if (_admin) return _admin;
  _admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
  return _admin;
}

export const ADMIN_EMAILS = (Deno.env.get("ADMIN_NOTIFICATION_EMAILS") ||
  "pauloposteral@hotmail.com")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export interface NotifyInput {
  type: string;
  to: string;
  data?: Record<string, unknown>;
  assinaturaId?: string | null;
  cicloId?: string | null;
  pedidoId?: string | null;
  maxAttempts?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Envia um e-mail registrado. Nunca lança — falhas ficam gravadas no log. */
export async function notify(input: NotifyInput): Promise<boolean> {
  const supabase = adminClient();
  const maxAttempts = input.maxAttempts ?? 5;

  const { data: logRow } = await supabase
    .from("notification_log")
    .insert({
      tipo: input.type,
      canal: "email",
      destinatario: input.to,
      assinatura_id: input.assinaturaId ?? null,
      ciclo_id: input.cicloId ?? null,
      pedido_id: input.pedidoId ?? null,
      status: "queued",
    })
    .select("id")
    .maybeSingle();

  const logId = logRow?.id as string | undefined;
  let lastError = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ type: input.type, to: input.to, data: input.data || {} }),
      });
      const body = await res.text();
      if (res.ok) {
        let providerId: string | null = null;
        try {
          providerId = JSON.parse(body)?.id ?? null;
        } catch { /* corpo não-JSON: ignora */ }
        if (logId) {
          await supabase
            .from("notification_log")
            .update({
              status: "sent",
              tentativas: attempt,
              sent_at: new Date().toISOString(),
              provider_message_id: providerId,
            })
            .eq("id", logId);
        }
        console.log(`📧 notify[${input.type}] → ${input.to} ok (tentativa ${attempt})`);
        return true;
      }
      lastError = `HTTP ${res.status}: ${body.slice(0, 400)}`;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
    console.warn(`⚠️ notify[${input.type}] falhou (tentativa ${attempt}): ${lastError}`);
    if (attempt < maxAttempts) await sleep(Math.min(1000 * 2 ** (attempt - 1), 8000));
  }

  if (logId) {
    await supabase
      .from("notification_log")
      .update({ status: "failed", tentativas: maxAttempts, ultimo_erro: lastError })
      .eq("id", logId);
  }

  // Canal alternativo: avisa o admin que uma notificação morreu de vez.
  if (!ADMIN_EMAILS.includes(input.to)) {
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          type: "admin_notification_failed",
          to: ADMIN_EMAILS[0],
          data: { tipo: input.type, destinatario: input.to, erro: lastError },
        }),
      });
    } catch { /* nada mais a fazer */ }
  }
  return false;
}

/** Dispara o mesmo e-mail para todos os endereços de admin configurados. */
export async function notifyAdmins(
  type: string,
  data: Record<string, unknown>,
  refs: { assinaturaId?: string | null; cicloId?: string | null } = {}
) {
  for (const to of ADMIN_EMAILS) {
    await notify({ type, to, data, ...refs });
  }
}
