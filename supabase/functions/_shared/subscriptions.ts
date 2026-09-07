// Regras compartilhadas do Clube La Régence: rótulos de plano, criação de
// ciclos de entrega, tokens de endereço e disparo das notificações.
import { adminClient, notify, notifyAdmins } from "./notify.ts";
import { shipByDate, formatShipBy } from "./businessDays.ts";

export const SITE = "https://cafelaregence.com.br";

export const PLAN_LABELS: Record<string, string> = {
  mensal: "Explorador",
  trimestral: "Connoisseur",
  semestral: "Sommelier",
};

export const MOAGEM_LABELS: Record<string, string> = {
  graos: "Grãos inteiros",
  grossa: "Grossa (French Press)",
  media: "Média (Coador/V60)",
  fina: "Fina (Espresso)",
  extra_fina: "Extra fina (Turco)",
};

export function planLabel(tipo?: string | null) {
  return PLAN_LABELS[tipo || ""] || tipo || "Clube La Régence";
}

export function brl(v: number | string | null | undefined) {
  const n = Number(v || 0);
  return n.toFixed(2).replace(".", ",");
}

export function formatEndereco(e: any): string {
  if (!e) return "";
  const l1 = `${e.logradouro || ""}, ${e.numero || "s/n"}${e.complemento ? ` — ${e.complemento}` : ""}`;
  const l2 = [e.bairro, `${e.cidade || ""}/${e.estado || ""}`].filter(Boolean).join(" · ");
  const l3 = e.cep ? `CEP ${e.cep}` : "";
  const dest = e.destinatario ? `${e.destinatario}<br>` : "";
  return [dest + l1, l2, l3].filter(Boolean).join("<br>");
}

export function formatDateBR(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Cria um token de uso único (7 dias) e devolve o link público. */
export async function createAddressLink(assinaturaId: string): Promise<string> {
  const supabase = adminClient();
  const raw = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const hash = await sha256(raw);
  await supabase.from("action_tokens").insert({
    assinatura_id: assinaturaId,
    purpose: "subscription_address",
    token_hash: hash,
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  });
  return `${SITE}/assinatura/endereco?token=${raw}`;
}

export async function hashToken(raw: string) {
  return await sha256(raw);
}

/** Dados do cliente (e-mail/nome/telefone) a partir do user_id. */
export async function getCustomer(userId: string) {
  const supabase = adminClient();
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("user_id", userId)
    .maybeSingle();
  const email = authUser?.user?.email || "";
  const fullName = (profile?.full_name as string) || (authUser?.user?.user_metadata?.full_name as string) || "";
  return {
    email,
    nome: fullName,
    primeiroNome: fullName.split(" ")[0] || "",
    telefone: (profile?.phone as string) || "",
  };
}

/**
 * Garante que existe um ciclo de entrega para o período informado.
 * Quando cria um ciclo novo, dispara os e-mails ao cliente e ao admin.
 */
export async function ensureCicloAndNotify(assinaturaId: string, periodoRef: string) {
  const supabase = adminClient();

  const { data: assinatura } = await supabase
    .from("assinaturas")
    .select("*, produtos(nome)")
    .eq("id", assinaturaId)
    .maybeSingle();
  if (!assinatura) return null;

  const endereco = (assinatura as any).endereco_entrega;
  const despacharAte = shipByDate(new Date(), 3);

  const { count } = await supabase
    .from("assinatura_ciclos")
    .select("id", { count: "exact", head: true })
    .eq("assinatura_id", assinaturaId);

  const { data: ciclo, error } = await supabase
    .from("assinatura_ciclos")
    .insert({
      assinatura_id: assinaturaId,
      user_id: (assinatura as any).user_id,
      numero: (count || 0) + 1,
      periodo_ref: periodoRef,
      status: endereco ? "ready_to_ship" : "awaiting_address",
      endereco_snapshot: endereco || null,
      preferencias_snapshot: {
        moagem: (assinatura as any).moagem,
        cafe_surpresa: (assinatura as any).cafe_surpresa,
        produto_id: (assinatura as any).produto_id,
        produto_nome: (assinatura as any).produtos?.nome || null,
      },
      despachar_ate: endereco ? despacharAte : null,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    // 23505 = ciclo já existe para este período (webhook repetido) → no-op
    if ((error as any).code === "23505") {
      console.log(`↩️ Ciclo ${periodoRef} da assinatura ${assinaturaId} já existe`);
      return null;
    }
    console.error("Erro ao criar ciclo:", error.message);
    return null;
  }

  await sendActivationEmails(assinatura, ciclo);
  return ciclo;
}

/** E-mails de ativação: cliente + admin (e pedido de endereço se faltar). */
export async function sendActivationEmails(assinatura: any, ciclo: any) {
  const customer = await getCustomer(assinatura.user_id);
  const endereco = assinatura.endereco_entrega;
  const enderecoHtml = endereco ? formatEndereco(endereco) : "";
  const despacharAte = ciclo?.despachar_ate ? formatShipBy(ciclo.despachar_ate) : "";
  const cafe = assinatura.cafe_surpresa ? "Surpresa (curadoria)" : assinatura.produtos?.nome || "Café fixo";

  const base = {
    nome: customer.primeiroNome,
    plano: planLabel(assinatura.tipo),
    valor: brl(assinatura.preco),
    cafe,
    moagem: MOAGEM_LABELS[assinatura.moagem] || assinatura.moagem || "—",
    proximaCobranca: formatDateBR(assinatura.proxima_entrega),
    endereco: enderecoHtml,
    despacharAte,
  };

  if (customer.email) {
    if (endereco) {
      await notify({
        type: "subscription_confirmed",
        to: customer.email,
        data: base,
        assinaturaId: assinatura.id,
        cicloId: ciclo?.id ?? null,
      });
    } else {
      const link = await createAddressLink(assinatura.id);
      await notify({
        type: "subscription_address_needed",
        to: customer.email,
        data: { ...base, link },
        assinaturaId: assinatura.id,
        cicloId: ciclo?.id ?? null,
      });
    }
  }

  await notifyAdmins(
    "admin_new_subscription",
    {
      ...base,
      email: customer.email,
      telefone: assinatura.telefone_contato || customer.telefone,
    },
    { assinaturaId: assinatura.id, cicloId: ciclo?.id ?? null }
  );
}
