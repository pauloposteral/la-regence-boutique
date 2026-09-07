// Ações administrativas sobre assinaturas: marcar despacho (com rastreio),
// pedir endereço ao cliente e reenviar a confirmação. Só para papel admin.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { adminClient, notify, notifyAdmins } from "../_shared/notify.ts";
import {
  planLabel, brl, MOAGEM_LABELS, formatEndereco, formatDateBR, getCustomer, createAddressLink,
} from "../_shared/subscriptions.ts";
import { formatShipBy } from "../_shared/businessDays.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Não autenticado" }, 401);

    const supabase = adminClient();
    const { data: userData } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = userData?.user;
    if (!user) return json({ error: "Sessão inválida" }, 401);

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Acesso negado" }, 403);

    const { action, assinaturaId, cicloId, transportadora, codigoRastreio, urlRastreio } =
      await req.json().catch(() => ({}));
    if (!action || !assinaturaId) return json({ error: "Parâmetros inválidos" }, 400);

    const { data: assinatura } = await supabase
      .from("assinaturas")
      .select("*, produtos(nome)")
      .eq("id", assinaturaId)
      .maybeSingle();
    if (!assinatura) return json({ error: "Assinatura não encontrada" }, 404);

    const a = assinatura as any;
    const customer = await getCustomer(a.user_id);
    const base = {
      nome: customer.primeiroNome,
      plano: planLabel(a.tipo),
      valor: brl(a.preco),
      cafe: a.cafe_surpresa ? "Surpresa (curadoria)" : a.produtos?.nome || "Café fixo",
      moagem: MOAGEM_LABELS[a.moagem] || a.moagem,
      proximaCobranca: formatDateBR(a.proxima_entrega),
      endereco: a.endereco_entrega ? formatEndereco(a.endereco_entrega) : "",
    };

    if (action === "ship") {
      if (!cicloId || !transportadora?.trim() || !codigoRastreio?.trim())
        return json({ error: "Transportadora e código de rastreio são obrigatórios" }, 400);

      const { data: ciclo } = await supabase
        .from("assinatura_ciclos")
        .select("*")
        .eq("id", cicloId)
        .maybeSingle();
      if (!ciclo) return json({ error: "Ciclo não encontrado" }, 404);
      if ((ciclo as any).status === "shipped")
        return json({ ok: true, alreadyShipped: true });

      await supabase
        .from("assinatura_ciclos")
        .update({
          status: "shipped",
          despachado_em: new Date().toISOString(),
          transportadora: transportadora.trim(),
          codigo_rastreio: codigoRastreio.trim(),
          url_rastreio: urlRastreio?.trim() || null,
        })
        .eq("id", cicloId);

      if (customer.email) {
        await notify({
          type: "subscription_shipped",
          to: customer.email,
          data: {
            nome: customer.primeiroNome,
            transportadora: transportadora.trim(),
            codigoRastreio: codigoRastreio.trim(),
            urlRastreio: urlRastreio?.trim() || "",
            endereco: (ciclo as any).endereco_snapshot ? formatEndereco((ciclo as any).endereco_snapshot) : base.endereco,
          },
          assinaturaId: a.id,
          cicloId,
        });
      }
      return json({ ok: true });
    }

    if (action === "request_address") {
      if (!customer.email) return json({ error: "Cliente sem e-mail" }, 400);
      const link = await createAddressLink(a.id);
      await notify({
        type: "subscription_address_needed",
        to: customer.email,
        data: { ...base, link },
        assinaturaId: a.id,
      });
      return json({ ok: true });
    }

    if (action === "resend_confirmation") {
      if (!customer.email) return json({ error: "Cliente sem e-mail" }, 400);
      const { data: ciclos } = await supabase
        .from("assinatura_ciclos")
        .select("despachar_ate")
        .eq("assinatura_id", a.id)
        .order("created_at", { ascending: false })
        .limit(1);
      const despacharAte = (ciclos as any)?.[0]?.despachar_ate;
      await notify({
        type: "subscription_confirmed",
        to: customer.email,
        data: { ...base, despacharAte: despacharAte ? formatShipBy(despacharAte) : "" },
        assinaturaId: a.id,
      });
      return json({ ok: true });
    }

    if (action === "notify_admin_test") {
      await notifyAdmins("admin_new_subscription", { ...base, email: customer.email }, { assinaturaId: a.id });
      return json({ ok: true });
    }

    return json({ error: "Ação desconhecida" }, 400);
  } catch (e) {
    console.error("subscription-admin error", e);
    return json({ error: e instanceof Error ? e.message : "Erro" }, 500);
  }
});
