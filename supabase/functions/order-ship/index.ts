// Marca um pedido como enviado exigindo transportadora + código de rastreio,
// grava o rastreio e avisa o cliente por e-mail no mesmo clique. Só admin.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { adminClient, notify } from "../_shared/notify.ts";
import { getCustomer } from "../_shared/subscriptions.ts";

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

    const { pedidoId, transportadora, codigoRastreio, urlRastreio } =
      await req.json().catch(() => ({}));

    if (!pedidoId) return json({ error: "Pedido não informado" }, 400);
    if (!transportadora?.trim() || !codigoRastreio?.trim())
      return json({ error: "Transportadora e código de rastreio são obrigatórios" }, 400);

    const { data: pedido } = await supabase
      .from("pedidos")
      .select("id, order_number, status, user_id, email_visitante")
      .eq("id", pedidoId)
      .maybeSingle();
    if (!pedido) return json({ error: "Pedido não encontrado" }, 404);

    const p = pedido as any;

    const { error: updErr } = await supabase
      .from("pedidos")
      .update({ status: "enviado", codigo_rastreamento: codigoRastreio.trim() })
      .eq("id", pedidoId);
    if (updErr) return json({ error: updErr.message }, 500);

    await supabase.from("order_status_history").insert({
      pedido_id: pedidoId,
      status_anterior: p.status,
      status_novo: "enviado",
      observacao: `${transportadora.trim()} · ${codigoRastreio.trim()}`,
    });

    let email: string = p.email_visitante || "";
    if (!email && p.user_id) email = (await getCustomer(p.user_id)).email;

    let emailed = false;
    if (email) {
      emailed = await notify({
        type: "order_shipped",
        to: email,
        data: {
          orderId: p.id,
          orderNumber: p.order_number,
          trackingCode: codigoRastreio.trim(),
          carrier: transportadora.trim(),
          trackingUrl: urlRastreio?.trim() || "",
        },
        pedidoId: p.id,
      });
    }

    return json({ ok: true, emailed, email: email ? true : false });
  } catch (e) {
    console.error("order-ship error", e);
    return json({ error: e instanceof Error ? e.message : "Erro" }, 500);
  }
});
