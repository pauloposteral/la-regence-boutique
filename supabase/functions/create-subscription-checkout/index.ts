// Cria sessão Stripe Checkout em modo subscription para o Clube La Régence.
// Salva (ou reaproveita) o stripe_customer_id no profile do usuário.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimit, callerKey } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Mapping plano -> price_id (Stripe LIVE prices criados via tool)
const PLAN_PRICES: Record<string, { priceId: string; valor: number }> = {
  mensal: { priceId: "price_1TS2DMK7VFRW1YcZojLXkURw", valor: 49.9 },
  trimestral: { priceId: "price_1TS2DOK7VFRW1YcZs4Nxapd3", valor: 44.9 },
  semestral: { priceId: "price_1TS2DPK7VFRW1YcZN7AEVovj", valor: 39.9 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const allowed = await checkRateLimit(callerKey(req, "sub-checkout", user.id), 5, 60);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Muitas tentativas. Aguarde 1 minuto." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { tipo, moagem, cafeSurpresa, produtoId } = body;
    const plan = PLAN_PRICES[tipo];
    if (!plan) {
      return new Response(JSON.stringify({ error: "Plano inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    // Reuse or create customer
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id, full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id || null;
    if (!customerId) {
      const list = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = list.data[0]?.id || null;
      if (!customerId) {
        const c = await stripe.customers.create({
          email: user.email,
          name: profile?.full_name || undefined,
          metadata: { user_id: user.id },
        });
        customerId = c.id;
      }
      await supabaseAdmin.from("profiles").update({ stripe_customer_id: customerId }).eq("user_id", user.id);
    }

    const origin = req.headers.get("origin") || "https://lojalaregence.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${origin}/conta?assinatura=ok`,
      cancel_url: `${origin}/assinatura`,
      subscription_data: {
        metadata: {
          user_id: user.id,
          tipo,
          moagem: moagem || "media",
          cafe_surpresa: String(!!cafeSurpresa),
          produto_id: produtoId || "",
        },
      },
      allow_promotion_codes: true,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-subscription-checkout error", e);
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
