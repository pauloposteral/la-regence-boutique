// Abandoned cart recovery — finds pedidos pendentes há > 1h sem email enviado e dispara recuperação
// Trigger via cron (Supabase Scheduled Functions) or manual call.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1h
    const minAge = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // not older than 7d

    const { data: pedidos, error } = await admin
      .from("pedidos")
      .select("id, email_visitante, user_id, total, created_at")
      .eq("status", "pendente")
      .is("abandoned_email_sent_at", null)
      .lt("created_at", cutoff)
      .gt("created_at", minAge)
      .limit(50);

    if (error) throw error;
    if (!pedidos || pedidos.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    for (const p of pedidos) {
      let email = p.email_visitante;
      if (!email && p.user_id) {
        const { data: u } = await admin.auth.admin.getUserById(p.user_id);
        email = u?.user?.email ?? null;
      }
      if (!email) continue;

      try {
        await admin.functions.invoke("send-email", {
          body: {
            type: "status_update",
            to: email,
            data: {
              orderId: p.id,
              status: "Carrinho aguardando — VOLTE5 dá 5% off",
            },
          },
        });
        await admin
          .from("pedidos")
          .update({ abandoned_email_sent_at: new Date().toISOString() })
          .eq("id", p.id);
        sent++;
      } catch (e) {
        console.warn("send fail for", p.id, e);
      }
    }

    return new Response(JSON.stringify({ processed: pedidos.length, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("abandoned-cart-recovery error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
