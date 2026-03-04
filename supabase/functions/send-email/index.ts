import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  type: "order_confirmation" | "welcome" | "status_update";
  to: string;
  data: Record<string, any>;
}

// Simple in-memory rate limiter (per-isolate)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max emails per window
const RATE_WINDOW_MS = 60000; // 1 minute

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data } = (await req.json()) as EmailRequest;

    // Rate limit check
    if (isRateLimited(to)) {
      return new Response(
        JSON.stringify({ error: "Muitas solicitações. Tente novamente em 1 minuto." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let subject = "";
    let html = "";

    const header = `
      <div style="background:#2a1a0f;padding:24px;text-align:center">
        <h1 style="color:#d4a853;font-family:Georgia,serif;margin:0;font-size:24px">
          La <em>Régence</em>
        </h1>
      </div>
    `;

    const footer = `
      <div style="background:#f5f0eb;padding:16px;text-align:center;font-size:12px;color:#8b7355">
        <p>La Régence — Cafés Especiais desde 2006</p>
        <p>Andradina-SP · (18) 99654-0883</p>
      </div>
    `;

    switch (type) {
      case "welcome":
        subject = "Bem-vindo à La Régence! ☕";
        html = `
          ${header}
          <div style="padding:32px;font-family:Arial,sans-serif;color:#2a1a0f">
            <h2 style="margin:0 0 16px">Olá, ${data.name || ""}!</h2>
            <p>Sua conta foi criada com sucesso. Estamos felizes em ter você conosco.</p>
            <p>Explore nossos cafés especiais com torrefação artesanal e pontuação SCA acima de 80 pontos.</p>
            <div style="text-align:center;margin:24px 0">
              <a href="https://laregence.com.br/cafes" 
                 style="background:#d4a853;color:#2a1a0f;padding:12px 32px;text-decoration:none;border-radius:4px;font-weight:bold;display:inline-block">
                Explorar Cafés
              </a>
            </div>
            <p style="font-size:14px;color:#8b7355">Use o código <strong>BEMVINDO10</strong> para 10% off na sua primeira compra!</p>
          </div>
          ${footer}
        `;
        break;

      case "order_confirmation":
        subject = `Pedido #${(data.orderId || "").slice(0, 8)} confirmado! ☕`;
        html = `
          ${header}
          <div style="padding:32px;font-family:Arial,sans-serif;color:#2a1a0f">
            <h2 style="margin:0 0 16px">Pedido confirmado!</h2>
            <p>Seu pedido <strong>#${(data.orderId || "").slice(0, 8)}</strong> foi recebido com sucesso.</p>
            <div style="background:#f5f0eb;padding:16px;border-radius:8px;margin:16px 0">
              <p style="margin:4px 0"><strong>Total:</strong> R$ ${data.total || "0,00"}</p>
              <p style="margin:4px 0"><strong>Pagamento:</strong> ${data.paymentMethod || "—"}</p>
              <p style="margin:4px 0"><strong>Itens:</strong> ${data.itemCount || 0} produto(s)</p>
            </div>
            <p>Agora é só aguardar! Você receberá atualizações sobre o envio por e-mail.</p>
            <div style="text-align:center;margin:24px 0">
              <a href="https://laregence.com.br/conta" 
                 style="background:#d4a853;color:#2a1a0f;padding:12px 32px;text-decoration:none;border-radius:4px;font-weight:bold;display:inline-block">
                Acompanhar Pedido
              </a>
            </div>
          </div>
          ${footer}
        `;
        break;

      case "status_update":
        subject = `Atualização do pedido #${(data.orderId || "").slice(0, 8)}`;
        html = `
          ${header}
          <div style="padding:32px;font-family:Arial,sans-serif;color:#2a1a0f">
            <h2 style="margin:0 0 16px">Atualização do seu pedido</h2>
            <p>O pedido <strong>#${(data.orderId || "").slice(0, 8)}</strong> teve o status atualizado para:</p>
            <div style="background:#f5f0eb;padding:16px;border-radius:8px;margin:16px 0;text-align:center">
              <p style="font-size:18px;font-weight:bold;color:#d4a853;margin:0">${data.status || ""}</p>
            </div>
            ${data.trackingCode ? `<p>Código de rastreamento: <strong>${data.trackingCode}</strong></p>` : ""}
            <div style="text-align:center;margin:24px 0">
              <a href="https://laregence.com.br/conta" 
                 style="background:#d4a853;color:#2a1a0f;padding:12px 32px;text-decoration:none;border-radius:4px;font-weight:bold;display:inline-block">
                Ver Detalhes
              </a>
            </div>
          </div>
          ${footer}
        `;
        break;

      default:
        return new Response(JSON.stringify({ error: "Tipo de e-mail inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Use Supabase's built-in email via the auth admin API
    // For production, integrate with a transactional email service (Resend, SendGrid, etc.)
    // For now, we log the email content and return success
    console.log(`📧 Email [${type}] to ${to}: ${subject}`);

    return new Response(
      JSON.stringify({ success: true, message: `Email ${type} queued for ${to}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao processar e-mail" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
