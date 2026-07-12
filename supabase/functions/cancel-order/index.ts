// Permite ao cliente cancelar o próprio pedido enquanto ainda não foi enviado.
// Se houver payment_intent Stripe, tenta reembolsar; sempre marca o pedido como "cancelado".
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CANCELLABLE = new Set(["pendente", "pago", "confirmado", "preparando", "torrando", "embalando"]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { pedido_id, motivo } = await req.json().catch(() => ({}));
    if (!pedido_id || typeof pedido_id !== "string") {
      return new Response(JSON.stringify({ error: "pedido_id obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await admin.auth.getUser(token);
    const user = userData.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pedido, error: pErr } = await admin
      .from("pedidos")
      .select("id, user_id, status, stripe_payment_intent, total")
      .eq("id", pedido_id)
      .maybeSingle();
    if (pErr || !pedido) {
      return new Response(JSON.stringify({ error: "Pedido não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (pedido.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!CANCELLABLE.has(pedido.status)) {
      return new Response(
        JSON.stringify({ error: `Pedido no status "${pedido.status}" não pode ser cancelado. Entre em contato.` }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let refunded = false;
    if (pedido.stripe_payment_intent) {
      try {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
        await stripe.refunds.create({
          payment_intent: pedido.stripe_payment_intent,
          reason: "requested_by_customer",
          metadata: { pedido_id, motivo: motivo || "" },
        });
        refunded = true;
      } catch (e) {
        console.error("[cancel-order] refund error", (e as Error).message);
      }
    }

    const novoStatus = refunded ? "reembolsado" : "cancelado";
    const { error: uErr } = await admin
      .from("pedidos")
      .update({ status: novoStatus })
      .eq("id", pedido_id);
    if (uErr) throw uErr;

    return new Response(JSON.stringify({ ok: true, refunded, status: novoStatus }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[cancel-order] erro", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
