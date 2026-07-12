// Envia e-mail de pós-venda (pedido de avaliação) para pedidos entregues há 3-14 dias
// sem e-mail enviado. Trigger via cron ou chamada manual.
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

    // entregue há mais de 3 dias, no máximo 14
    const minAge = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const maxAge = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data: pedidos, error } = await admin
      .from("pedidos")
      .select("id, email_visitante, user_id, updated_at")
      .eq("status", "entregue")
      .is("review_email_sent_at", null)
      .lt("updated_at", minAge)
      .gt("updated_at", maxAge)
      .limit(50);

    if (error) throw error;
    if (!pedidos || pedidos.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    for (const p of pedidos) {
      let email = p.email_visitante as string | null;
      let name: string | undefined;
      if (!email && p.user_id) {
        const { data: u } = await admin.auth.admin.getUserById(p.user_id);
        email = u?.user?.email ?? null;
        name = (u?.user?.user_metadata as any)?.full_name;
      }
      if (!email) continue;

      try {
        await admin.functions.invoke("send-email", {
          body: {
            type: "review_request",
            to: email,
            data: { orderId: p.id, name },
          },
        });
        await admin
          .from("pedidos")
          .update({ review_email_sent_at: new Date().toISOString() })
          .eq("id", p.id);
        sent++;
      } catch (e) {
        console.warn("review send fail", p.id, e);
      }
    }

    return new Response(JSON.stringify({ processed: pedidos.length, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-review-requests error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
