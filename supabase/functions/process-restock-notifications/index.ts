// Roda periodicamente: para cada assinatura pendente de "avise-me quando chegar",
// verifica se o produto/variante voltou ao estoque e dispara e-mail via send-email.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    const { data: pending, error } = await admin
      .from("notify_restock")
      .select("id, produto_id, variante_id, email, produtos(nome, slug, estoque, ativo), variantes(estoque)")
      .is("notified_at", null)
      .limit(500);
    if (error) throw error;

    let sent = 0;
    for (const row of pending || []) {
      const prod: any = (row as any).produtos;
      const variant: any = (row as any).variantes;
      if (!prod || !prod.ativo) continue;

      const inStock = row.variante_id
        ? (variant?.estoque ?? 0) > 0
        : (prod.estoque ?? 0) > 0;
      if (!inStock) continue;

      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            type: "back_in_stock",
            to: row.email,
            data: { produtoNome: prod.nome, slug: prod.slug },
          }),
        });
        await admin
          .from("notify_restock")
          .update({ notified_at: new Date().toISOString() })
          .eq("id", row.id);
        sent++;
      } catch (e) {
        console.error("[restock] falhou envio", row.id, (e as Error).message);
      }
    }

    return new Response(JSON.stringify({ ok: true, checked: pending?.length || 0, sent }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[process-restock-notifications] erro", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
