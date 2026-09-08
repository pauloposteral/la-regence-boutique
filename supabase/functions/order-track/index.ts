// Rastreio público: número do pedido + e-mail usado na compra.
// Não expõe dados sensíveis — só status, datas e código de rastreio.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { adminClient } from "../_shared/notify.ts";
import { checkRateLimit, callerKey } from "../_shared/rateLimit.ts";

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
    const allowed = await checkRateLimit(callerKey(req, "order-track"), 20, 60);
    if (!allowed) return json({ error: "Muitas tentativas. Aguarde um minuto." }, 429);

    const body = await req.json().catch(() => ({}));
    const pedidoRaw = String(body?.pedido || "").trim().replace(/^#/, "");
    const email = String(body?.email || "").trim().toLowerCase();

    if (!pedidoRaw || !email.includes("@"))
      return json({ error: "Informe o número do pedido e o e-mail da compra." }, 400);

    const supabase = adminClient();

    // Busca por número do pedido (preferencial) ou por início do ID.
    let pedido: any = null;
    if (/^\d+$/.test(pedidoRaw)) {
      const { data } = await supabase
        .from("pedidos")
        .select("id, order_number, status, created_at, updated_at, total, codigo_rastreamento, user_id, email_visitante")
        .eq("order_number", Number(pedidoRaw))
        .maybeSingle();
      pedido = data;
    }
    if (!pedido) {
      const { data } = await supabase
        .from("pedidos")
        .select("id, order_number, status, created_at, updated_at, total, codigo_rastreamento, user_id, email_visitante")
        .ilike("id", `${pedidoRaw}%`)
        .limit(2);
      if (data && data.length === 1) pedido = data[0];
    }

    const notFound = () => json({ error: "Pedido não encontrado com esses dados." }, 404);
    if (!pedido) return notFound();

    // Confere o e-mail: visitante ou dono da conta.
    let donoEmail = (pedido.email_visitante || "").toLowerCase();
    if (!donoEmail && pedido.user_id) {
      const { data: authUser } = await supabase.auth.admin.getUserById(pedido.user_id);
      donoEmail = (authUser?.user?.email || "").toLowerCase();
    }
    if (!donoEmail || donoEmail !== email) return notFound();

    const { data: historico } = await supabase
      .from("order_status_history")
      .select("status_novo, created_at")
      .eq("pedido_id", pedido.id)
      .order("created_at", { ascending: true });

    return json({
      ok: true,
      pedido: {
        numero: pedido.order_number ? `#${pedido.order_number}` : `#${String(pedido.id).slice(0, 8).toUpperCase()}`,
        status: pedido.status,
        criadoEm: pedido.created_at,
        atualizadoEm: pedido.updated_at,
        total: Number(pedido.total),
        codigoRastreamento: pedido.codigo_rastreamento || null,
      },
      historico: (historico || []).map((h: any) => ({ status: h.status_novo, em: h.created_at })),
    });
  } catch (e) {
    console.error("order-track error", e);
    return json({ error: e instanceof Error ? e.message : "Erro" }, 500);
  }
});
