// Conferência diária: assinaturas ativas sem endereço, sem e-mail de
// confirmação e ciclos com prazo vencido. Age e manda o resumo ao admin.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { adminClient, notify, notifyAdmins } from "../_shared/notify.ts";
import { planLabel, brl, createAddressLink, getCustomer, formatEndereco, formatDateBR, MOAGEM_LABELS, ensureCicloAndNotify } from "../_shared/subscriptions.ts";
import { saoPauloDateString, formatShipBy } from "../_shared/businessDays.ts";

/** Valor mensal (centavos) → tipo de plano do Clube. */
const PLANO_POR_VALOR: Record<number, string> = {
  5900: "mensal",
  10900: "trimestral",
  18900: "semestral",
};

/**
 * Assinaturas pagas no Stripe que nunca chegaram ao banco (webhook antigo).
 * Cria o registro, o ciclo e dispara o pedido de endereço automaticamente.
 */
async function importarOrfaosDoStripe(detalhes: string[]): Promise<number> {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) return 0;
  const stripe = new Stripe(key, { apiVersion: "2025-08-27.basil" });
  const supabase = adminClient();
  let importadas = 0;

  const subs = await stripe.subscriptions.list({ status: "active", limit: 100 });
  if (!subs.data.length) return 0;

  const { data: usersPage } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const porEmail = new Map<string, string>();
  for (const u of usersPage?.users || []) {
    if (u.email) porEmail.set(u.email.toLowerCase(), u.id);
  }

  for (const sub of subs.data) {
    const { data: existente } = await supabase
      .from("assinaturas")
      .select("id")
      .eq("stripe_subscription_id", sub.id)
      .maybeSingle();
    if (existente) continue;

    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    if (!customerId) continue;
    const customer: any = await stripe.customers.retrieve(customerId);
    const email = (customer?.email || "").toLowerCase();
    const userId = email ? porEmail.get(email) : undefined;
    if (!userId) {
      detalhes.push(`Stripe ${sub.id}: pagamento ativo sem conta no site (${email || "sem e-mail"}) — resolver manualmente.`);
      continue;
    }

    const item: any = sub.items.data[0];
    const valor = item?.price?.unit_amount ?? 0;
    const tipo = PLANO_POR_VALOR[valor] || "mensal";
    const periodStart = item?.current_period_start ?? sub.start_date;
    const periodEnd = item?.current_period_end ?? null;

    const { data: nova, error } = await supabase
      .from("assinaturas")
      .insert({
        user_id: userId,
        tipo,
        status: "ativa",
        cafe_surpresa: true,
        preco: valor / 100,
        stripe_subscription_id: sub.id,
        stripe_price_id: item?.price?.id ?? null,
        proxima_entrega: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        telefone_contato: customer?.phone || null,
      })
      .select("id")
      .maybeSingle();

    if (error || !nova) {
      detalhes.push(`Stripe ${sub.id}: falha ao importar (${error?.message || "erro"}).`);
      continue;
    }

    await ensureCicloAndNotify(nova.id as string, new Date(periodStart * 1000).toISOString().slice(0, 10));
    importadas++;
    detalhes.push(`${email}: assinatura ${planLabel(tipo)} importada do Stripe e pedido de endereço enviado.`);
  }

  return importadas;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = adminClient();
  const hoje = saoPauloDateString();
  let acoes = 0;
  const detalhes: string[] = [];

  try {
    const { data: ativas } = await supabase
      .from("assinaturas")
      .select("*, produtos(nome)")
      .eq("status", "ativa");

    const lista = (ativas || []) as any[];
    const semEndereco = lista.filter((a) => !a.endereco_entrega);

    for (const a of semEndereco) {
      const customer = await getCustomer(a.user_id);
      if (!customer.email) continue;

      // Quantos pedidos de endereço já foram enviados e há quanto tempo
      const { data: envios } = await supabase
        .from("notification_log")
        .select("created_at")
        .eq("assinatura_id", a.id)
        .eq("tipo", "subscription_address_needed")
        .order("created_at", { ascending: false });

      const total = envios?.length || 0;
      const ultimo = envios?.[0]?.created_at ? new Date(envios[0].created_at as string) : null;
      const diasDesdeUltimo = ultimo ? (Date.now() - ultimo.getTime()) / 86400000 : Infinity;
      const primeiroEnvio = envios?.[envios.length - 1]?.created_at
        ? new Date(envios[envios.length - 1].created_at as string)
        : null;
      const diasDesdePrimeiro = primeiroEnvio ? (Date.now() - primeiroEnvio.getTime()) / 86400000 : 0;

      // D+7 sem resposta → ciclo em problema
      if (total > 0 && diasDesdePrimeiro >= 7) {
        await supabase
          .from("assinatura_ciclos")
          .update({ status: "problem", observacoes: "7 dias sem endereço informado" })
          .eq("assinatura_id", a.id)
          .eq("status", "awaiting_address");
        detalhes.push(`${customer.email}: 7 dias sem endereço — marcado como problema.`);
        continue;
      }

      // Envio inicial ou lembretes em D+1 e D+3 (máximo 3 e-mails)
      if (total === 0 || (total < 3 && diasDesdeUltimo >= 1)) {
        const link = await createAddressLink(a.id);
        await notify({
          type: "subscription_address_needed",
          to: customer.email,
          data: {
            nome: customer.primeiroNome,
            plano: planLabel(a.tipo),
            valor: brl(a.preco),
            moagem: MOAGEM_LABELS[a.moagem] || a.moagem,
            proximaCobranca: formatDateBR(a.proxima_entrega),
            link,
            lembrete: total > 0,
          },
          assinaturaId: a.id,
        });
        acoes++;
        detalhes.push(`${customer.email}: pedido de endereço enviado (${total + 1}º).`);
      }
    }

    // Ativas sem e-mail de confirmação enviado
    for (const a of lista.filter((x) => x.endereco_entrega)) {
      const { count } = await supabase
        .from("notification_log")
        .select("id", { count: "exact", head: true })
        .eq("assinatura_id", a.id)
        .eq("tipo", "subscription_confirmed")
        .eq("status", "sent");
      if ((count || 0) > 0) continue;

      const customer = await getCustomer(a.user_id);
      if (!customer.email) continue;
      const { data: ciclos } = await supabase
        .from("assinatura_ciclos")
        .select("despachar_ate")
        .eq("assinatura_id", a.id)
        .order("created_at", { ascending: false })
        .limit(1);
      await notify({
        type: "subscription_confirmed",
        to: customer.email,
        data: {
          nome: customer.primeiroNome,
          plano: planLabel(a.tipo),
          valor: brl(a.preco),
          cafe: a.cafe_surpresa ? "Surpresa (curadoria)" : a.produtos?.nome || "Café fixo",
          moagem: MOAGEM_LABELS[a.moagem] || a.moagem,
          proximaCobranca: formatDateBR(a.proxima_entrega),
          endereco: formatEndereco(a.endereco_entrega),
          despacharAte: (ciclos as any)?.[0]?.despachar_ate ? formatShipBy((ciclos as any)[0].despachar_ate) : "",
        },
        assinaturaId: a.id,
      });
      acoes++;
      detalhes.push(`${customer.email}: confirmação reenviada (não havia registro de envio).`);
    }

    const { count: aDespachar } = await supabase
      .from("assinatura_ciclos")
      .select("id", { count: "exact", head: true })
      .eq("status", "ready_to_ship");

    const { count: vencidas } = await supabase
      .from("assinatura_ciclos")
      .select("id", { count: "exact", head: true })
      .eq("status", "ready_to_ship")
      .lt("despachar_ate", hoje);

    await notifyAdmins("admin_reconciliation", {
      data: hoje.split("-").reverse().join("/"),
      ativas: lista.length,
      semEndereco: semEndereco.length,
      aDespachar: aDespachar || 0,
      vencidas: vencidas || 0,
      acoes,
      detalhes: detalhes.slice(0, 20).join("<br>"),
    });

    return new Response(
      JSON.stringify({ ok: true, ativas: lista.length, semEndereco: semEndereco.length, acoes }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("subscriptions-reconcile error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
