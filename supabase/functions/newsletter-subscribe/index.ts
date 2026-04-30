// Newsletter subscribe with double opt-in
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimit, callerKey } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Rate limit: 5 per minute per IP
    const allowed = await checkRateLimit(callerKey(req, "newsletter"), 5, 60);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Muitas tentativas. Aguarde 1 minuto." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email } = await req.json();
    const cleaned = String(email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(cleaned) || cleaned.length > 200) {
      return new Response(JSON.stringify({ error: "E-mail inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert by lowered email
    const { data: existing } = await admin
      .from("newsletter_subscribers")
      .select("id, confirmed, confirmation_token")
      .ilike("email", cleaned)
      .maybeSingle();

    let token: string;
    let alreadyConfirmed = false;

    if (existing) {
      if (existing.confirmed) {
        alreadyConfirmed = true;
        token = existing.confirmation_token;
      } else {
        token = existing.confirmation_token;
      }
    } else {
      const { data: ins, error: insErr } = await admin
        .from("newsletter_subscribers")
        .insert({ email: cleaned })
        .select("confirmation_token")
        .single();
      if (insErr) {
        // unique violation race — fetch again
        const { data: again } = await admin
          .from("newsletter_subscribers")
          .select("confirmation_token")
          .ilike("email", cleaned)
          .single();
        token = again?.confirmation_token;
      } else {
        token = ins.confirmation_token;
      }
    }

    if (alreadyConfirmed) {
      return new Response(
        JSON.stringify({ success: true, alreadyConfirmed: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build confirm URL
    const origin =
      req.headers.get("origin") ||
      "https://lojalaregence.lovable.app";
    const confirmUrl = `${origin}/newsletter/confirmar?token=${token}`;

    // Best-effort: enqueue confirmation email via existing send-email function
    try {
      await admin.functions.invoke("send-email", {
        body: {
          type: "welcome",
          to: cleaned,
          data: { name: "", confirmUrl },
        },
      });
    } catch (e) {
      console.warn("send-email failed (non-blocking):", e);
    }

    console.log(`📧 Newsletter confirmation pending for ${cleaned} → ${confirmUrl}`);

    return new Response(
      JSON.stringify({ success: true, message: "Confirme seu e-mail para concluir a inscrição." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("newsletter-subscribe error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
