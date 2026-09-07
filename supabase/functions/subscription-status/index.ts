// Estado real da assinatura após o checkout (página de sucesso).
// Nunca ativa nada: apenas lê o Stripe + o nosso banco (RN-001).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { planLabel, brl, MOAGEM_LABELS, formatDateBR } from "../_shared/subscriptions.ts";
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: userData } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = userData?.user;
    if (!user) return json({ error: "Sessão inválida" }, 401);

    const { sessionId } = await req.json().catch(() => ({ sessionId: null }));

    let stripeState: "paid" | "pending" | "failed" | "unknown" = "unknown";
    let subscriptionId: string | null = null;

    if (sessionId) {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        subscriptionId = (session.subscription as string) || null;
        stripeState =
          session.payment_status === "paid"
            ? "paid"
            : session.status === "expired"
            ? "failed"
            : "pending";
      } catch (e) {
        console.warn("Sessão Stripe não encontrada:", e);
      }
    }

    let query = supabase
      .from("assinaturas")
      .select("*, produtos(nome)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (subscriptionId) query = supabase
      .from("assinaturas")
      .select("*, produtos(nome)")
      .eq("stripe_subscription_id", subscriptionId)
      .eq("user_id", user.id)
      .limit(1);

    const { data: rows } = await query;
    const assinatura: any = rows?.[0] || null;

    let ciclo: any = null;
    if (assinatura) {
      const { data } = await supabase
        .from("assinatura_ciclos")
        .select("*")
        .eq("assinatura_id", assinatura.id)
        .order("created_at", { ascending: false })
        .limit(1);
      ciclo = data?.[0] || null;
    }

    const state =
      assinatura && assinatura.status === "ativa"
        ? "confirmed"
        : stripeState === "paid"
        ? "processing"
        : stripeState === "failed"
        ? "failed"
        : "pending";

    return json({
      state,
      assinaturaId: assinatura?.id ?? null,
      plano: assinatura ? planLabel(assinatura.tipo) : null,
      valor: assinatura ? brl(assinatura.preco) : null,
      cafe: assinatura ? (assinatura.cafe_surpresa ? "Surpresa (curadoria)" : assinatura.produtos?.nome || "Café fixo") : null,
      moagem: assinatura ? MOAGEM_LABELS[assinatura.moagem] || assinatura.moagem : null,
      proximaCobranca: assinatura ? formatDateBR(assinatura.proxima_entrega) : null,
      endereco: assinatura?.endereco_entrega ?? null,
      despacharAte: ciclo?.despachar_ate ? formatShipBy(ciclo.despachar_ate) : null,
      cicloStatus: ciclo?.status ?? null,
      email: user.email,
    });
  } catch (e) {
    console.error("subscription-status error", e);
    return json({ error: e instanceof Error ? e.message : "Erro" }, 500);
  }
});
