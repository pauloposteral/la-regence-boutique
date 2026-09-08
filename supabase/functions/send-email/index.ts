import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { checkRateLimit, callerKey } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type EmailType =
  | "welcome"
  | "order_confirmation"
  | "order_shipped"
  | "order_delivered"
  | "status_update"
  | "contact_reply"
  | "admin_new_order"
  | "review_request"
  | "back_in_stock"
  | "subscription_confirmed"
  | "subscription_address_needed"
  | "subscription_shipped"
  | "admin_new_subscription"
  | "admin_notification_failed"
  | "admin_reconciliation"
  | "admin_ship_reminder";

interface EmailRequest {
  type: EmailType;
  to: string;
  data: Record<string, any>;
}

const SITE = "https://cafelaregence.com.br";
const BRAND = "La Régence";
// Sender: default to a subdomain the user needs to verify in Resend.
// Override with FROM_EMAIL env var.
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "La Régence <contato@cafelaregence.com.br>";

// Palette (aligned with site design system)
const C = {
  cream: "#FAF7F2",
  card: "#F5F0E8",
  gold: "#C4A265",
  goldDark: "#B08D50",
  brown: "#5C4A32",
  brownDark: "#3D2E1C",
  brownDeep: "#1E1A14",
  text: "#2C2418",
  muted: "#9C8E7C",
  border: "#E8E0D4",
};

function shell(title: string, inner: string, preview = "") {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:${C.cream};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:${C.text}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preview}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};padding:32px 12px">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(30,26,20,.06)">
  <tr><td style="background:${C.brownDeep};padding:28px 32px;text-align:center">
    <div style="font-family:Georgia,'Times New Roman',serif;color:${C.gold};font-size:26px;letter-spacing:.02em">La <em style="font-style:italic">Régence</em></div>
    <div style="color:${C.cream};font-size:10px;letter-spacing:.3em;text-transform:uppercase;margin-top:6px;opacity:.7">Cafés Especiais · desde 2005</div>
  </td></tr>
  <tr><td style="padding:36px 32px">${inner}</td></tr>
  <tr><td style="background:${C.card};padding:20px 32px;text-align:center;font-size:12px;color:${C.brown};border-top:1px solid ${C.border}">
    <div style="font-family:Georgia,serif;color:${C.brownDark};font-size:14px;margin-bottom:6px">${BRAND}</div>
    <div>Av. Guanabara, 2919 — Stella Maris, Andradina/SP · (18) 99654-0883</div>
    <div style="margin-top:8px"><a href="${SITE}" style="color:${C.goldDark};text-decoration:none">cafelaregence.com.br</a></div>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

function btn(href: string, label: string) {
  return `<div style="text-align:center;margin:28px 0"><a href="${href}" style="display:inline-block;background:${C.gold};color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:999px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;font-weight:600">${label}</a></div>`;
}

function h(t: string) {
  return `<h1 style="font-family:Georgia,serif;color:${C.brownDark};font-size:26px;margin:0 0 16px;font-weight:500">${t}</h1>`;
}
function p(t: string) {
  return `<p style="margin:0 0 14px;line-height:1.6;color:${C.text};font-size:15px">${t}</p>`;
}
function box(inner: string) {
  return `<div style="background:${C.card};border:1px solid ${C.border};border-radius:10px;padding:18px 20px;margin:18px 0">${inner}</div>`;
}

function render(type: EmailType, d: Record<string, any>): { subject: string; html: string } {
  const shortId = (d.orderId || "").toString().slice(0, 8).toUpperCase();
  switch (type) {
    case "welcome":
      return {
        subject: "Bem-vindo à La Régence ☕",
        html: shell(
          "Bem-vindo",
          `${h(`Olá, ${d.name || "cafeicultor"}!`)}${p("Sua conta foi criada. Você agora faz parte de uma seleção rara de amantes de café especial.")}${p("Explore nossos micro-lotes com pontuação SCA acima de 80, torrados sob demanda para chegar frescos até você.")}${box(`${p(`Use o cupom <strong style="color:${C.gold}">BEMVINDO10</strong> para 10% de desconto na primeira compra.`)}`)}${btn(`${SITE}/cafes`, "Explorar Cafés")}`,
          "Sua conta foi criada com sucesso."
        ),
      };
    case "order_confirmation":
      return {
        subject: `Pedido #${shortId} confirmado`,
        html: shell(
          "Pedido confirmado",
          `${h("Recebemos seu pedido")}${p(`Obrigado pela sua compra, ${d.name || ""}. Seu pedido <strong>#${shortId}</strong> foi confirmado.`)}${box(`<div style="font-size:14px;color:${C.brown};line-height:1.9"><div><strong style="color:${C.brownDark}">Total:</strong> R$ ${d.total || "0,00"}</div><div><strong style="color:${C.brownDark}">Pagamento:</strong> ${d.paymentMethod || "—"}</div><div><strong style="color:${C.brownDark}">Itens:</strong> ${d.itemCount || 0} produto(s)</div></div>`)}${p("Vamos torrar seu café fresco e enviar em breve. Você receberá atualizações a cada etapa.")}${btn(`${SITE}/conta`, "Acompanhar Pedido")}`,
          "Seu pedido foi recebido."
        ),
      };
    case "order_shipped":
      return {
        subject: `Pedido #${shortId} a caminho`,
        html: shell(
          "Pedido enviado",
          `${h("Seu café está a caminho")}${p(`O pedido <strong>#${shortId}</strong> foi despachado e chegará em breve.`)}${d.trackingCode ? box(`${p(`<strong>Código de rastreio:</strong> ${d.trackingCode}`)}${d.carrier ? p(`<strong>Transportadora:</strong> ${d.carrier}`) : ""}${d.trackingUrl ? btn(d.trackingUrl, "Rastrear Envio") : ""}`) : ""}${btn(`${SITE}/conta`, "Ver Pedido")}`,
          "Seu pedido foi enviado."
        ),
      };
    case "order_delivered":
      return {
        subject: `Pedido #${shortId} entregue`,
        html: shell(
          "Pedido entregue",
          `${h("Seu café chegou")}${p("Esperamos que a experiência esteja à altura. Aproveite cada xícara.")}${p("Sua opinião nos ajuda a evoluir — avalie os produtos e ganhe pontos de fidelidade.")}${btn(`${SITE}/conta`, "Avaliar Produtos")}`,
          "Seu pedido foi entregue."
        ),
      };
    case "status_update":
      return {
        subject: `Atualização do pedido #${shortId}`,
        html: shell(
          "Atualização do pedido",
          `${h("Novidade sobre seu pedido")}${p(`O pedido <strong>#${shortId}</strong> teve o status atualizado.`)}${box(`<div style="text-align:center;font-size:18px;font-family:Georgia,serif;color:${C.gold}">${d.status || ""}</div>`)}${d.trackingCode ? p(`Código de rastreio: <strong>${d.trackingCode}</strong>`) : ""}${btn(`${SITE}/conta`, "Ver Detalhes")}`,
          "Atualização do seu pedido."
        ),
      };
    case "contact_reply":
      return {
        subject: "Recebemos sua mensagem",
        html: shell(
          "Contato recebido",
          `${h(`Obrigado, ${d.name || ""}`)}${p("Recebemos sua mensagem e vamos responder em até 1 dia útil.")}${d.message ? box(`<div style="font-size:13px;color:${C.brown};line-height:1.6"><em>"${String(d.message).slice(0, 400)}"</em></div>`) : ""}${btn(`${SITE}`, "Voltar à Loja")}`,
          "Recebemos sua mensagem."
        ),
      };
    case "admin_new_order":
      return {
        subject: `🔔 Novo pedido #${shortId} — R$ ${d.total || "0,00"}`,
        html: shell(
          "Novo pedido recebido",
          `${h("Novo pedido pago")}${p(`Pedido <strong>#${shortId}</strong> foi confirmado e pago.`)}${box(`<div style="font-size:14px;color:${C.brown};line-height:1.9"><div><strong style="color:${C.brownDark}">Cliente:</strong> ${d.customerName || d.customerEmail || "—"}</div><div><strong style="color:${C.brownDark}">E-mail:</strong> ${d.customerEmail || "—"}</div><div><strong style="color:${C.brownDark}">Total:</strong> R$ ${d.total || "0,00"}</div><div><strong style="color:${C.brownDark}">Pagamento:</strong> ${d.paymentMethod || "—"}</div><div><strong style="color:${C.brownDark}">Itens:</strong> ${d.itemCount || 0} produto(s)</div></div>`)}${btn(`${SITE}/admin/pedidos`, "Abrir no Admin")}`,
          `Novo pedido #${shortId}`
        ),
      };
    case "review_request":
      return {
        subject: `Como foi seu café? Avalie o pedido #${shortId}`,
        html: shell(
          "Avalie sua experiência",
          `${h(`Olá${d.name ? `, ${d.name}` : ""}!`)}${p(`Faz alguns dias que seu pedido <strong>#${shortId}</strong> foi entregue. Como foi a experiência?`)}${p("Sua avaliação ajuda outros amantes de café a descobrir os grãos certos — e você ganha <strong>50 pontos de fidelidade</strong> por cada produto avaliado.")}${box(`<div style="text-align:center;font-size:22px;color:${C.gold};letter-spacing:.15em">★ ★ ★ ★ ★</div>`)}${btn(`${SITE}/conta`, "Avaliar Produtos")}`,
          "Avalie seu pedido e ganhe pontos."
        ),
      };
    case "back_in_stock":
      return {
        subject: `${d.produtoNome || "Seu café"} voltou ao estoque ☕`,
        html: shell(
          "De volta ao estoque",
          `${h("Voltou pra você")}${p(`O café <strong>${d.produtoNome || ""}</strong> que você aguardava está de volta ao estoque — mas os micro-lotes esgotam rápido.`)}${btn(`${SITE}/cafe/${d.slug || ""}`, "Comprar agora")}${p(`<span style="font-size:12px;color:${C.muted}">Você recebeu este e-mail porque solicitou aviso de reposição. Não faremos mais envios sobre este produto.</span>`)}`,
          "Voltou ao estoque."
        ),
      };

    // ===== Clube La Régence (assinaturas) =====
    case "subscription_confirmed": {
      const enderecoBox = d.endereco
        ? box(`<div style="font-size:13px;color:${C.brown};line-height:1.7"><strong style="color:${C.brownDark}">Vai para:</strong><br>${d.endereco}</div>`)
        : `<div style="background:#FFF8E8;border:1px solid ${C.gold};border-radius:10px;padding:18px 20px;margin:18px 0;font-size:13px;color:${C.brown}">Ainda falta o endereço de entrega. Assim que você informar, seu café entra na fila de torra.</div>`;
      const primeiro = d.enderecoRecebido
        ? "Endereço recebido! Agora sim: seu café entra na fila de torra e sai daqui até " + (d.despacharAte || "") + "."
        : "Deu tudo certo: seu pagamento foi aprovado e sua assinatura já está ativa.";
      return {
        subject: "Sua assinatura La Régence está confirmada ☕",
        html: shell(
          "Assinatura confirmada",
          `${h(`Oi, ${d.nome || "tudo bem"}!`)}${p(primeiro)}${
            d.enderecoRecebido ? "" : p(`Agora é com a gente. Seu café vai ser torrado fresquinho e sai daqui até <strong>${d.despacharAte || "3 dias úteis"}</strong>. Assim que despachar, você recebe o código de rastreio por aqui.`)
          }${box(`<div style="font-size:14px;color:${C.brown};line-height:1.9"><div><strong style="color:${C.brownDark}">Plano:</strong> ${d.plano || "—"} · R$ ${d.valor || "—"}/mês</div><div><strong style="color:${C.brownDark}">Café:</strong> ${d.cafe || "Surpresa"}</div><div><strong style="color:${C.brownDark}">Moagem:</strong> ${d.moagem || "—"}</div><div><strong style="color:${C.brownDark}">Próxima cobrança:</strong> ${d.proximaCobranca || "—"}</div></div>`)}${enderecoBox}${btn(`${SITE}/conta?tab=assinatura`, "Ver minha assinatura")}${p("Qualquer dúvida, é só responder este e-mail ou chamar no WhatsApp (18) 99654-0883.")}${p(`<em style="color:${C.brown}">Respeita o grão.</em><br>Paulo · Café La Régence`)}`,
          `Plano ${d.plano || ""} ativo. Seu café sai daqui até ${d.despacharAte || "3 dias úteis"}.`
        ),
      };
    }
    case "subscription_address_needed":
      return {
        subject: d.lembrete ? "Seu café está esperando um endereço ☕" : "Falta só o endereço pra gente enviar seu café",
        html: shell(
          "Falta o endereço",
          `${h(`Oi, ${d.nome || "tudo bem"}.`)}${p(`Seu pagamento está confirmado e sua assinatura <strong>${d.plano || ""}</strong> está ativa. Só que na hora de assinar o site não pediu seu endereço… falha nossa, e já estamos corrigindo.`)}${p("Me diz pra onde enviar e seu café entra na fila de torra na hora:")}${btn(d.link || `${SITE}/assinatura/endereco`, "Informar endereço de entrega")}${p("Depois disso ele sai daqui em até 3 dias úteis, com rastreio.")}${p("Se preferir, responde este e-mail com o endereço completo e o CEP que eu mesmo cadastro.")}${p(`<em style="color:${C.brown}">Respeita o grão.</em><br>Paulo · Café La Régence`)}`,
          "Sua assinatura está ativa, mas falta o endereço. Leva um minuto."
        ),
      };
    case "subscription_shipped":
      return {
        subject: "Seu café saiu pra entrega 📦",
        html: shell(
          "Café despachado",
          `${h(`Oi, ${d.nome || "tudo bem"}!`)}${p("Seu café acabou de sair daqui de Andradina.")}${box(`<div style="font-size:14px;color:${C.brown};line-height:1.9"><div><strong style="color:${C.brownDark}">Transportadora:</strong> ${d.transportadora || "—"}</div><div><strong style="color:${C.brownDark}">Código:</strong> ${d.codigoRastreio || "—"}</div></div>${d.urlRastreio ? btn(d.urlRastreio, "Rastrear entrega") : ""}`)}${d.endereco ? box(`<div style="font-size:13px;color:${C.brown};line-height:1.7"><strong style="color:${C.brownDark}">Vai para:</strong><br>${d.endereco}</div>`) : ""}${p("Uma dica: café recém-torrado gosta de descansar uns dias. Quando chegar aí, ele vai estar no ponto.")}${p(`<em style="color:${C.brown}">Respeita o grão.</em><br>Paulo · Café La Régence`)}`,
          `Rastreio ${d.codigoRastreio || ""} · ${d.transportadora || ""}`
        ),
      };
    case "admin_new_subscription":
      return {
        subject: `[NOVA ASSINATURA] ${d.nome || d.email || "cliente"} · ${d.plano || ""} · R$ ${d.valor || "0,00"}/mês`,
        html: shell(
          "Nova assinatura",
          `${h("Nova assinatura paga")}${box(`<div style="font-size:14px;color:${C.brown};line-height:1.9"><div><strong style="color:${C.brownDark}">Cliente:</strong> ${d.nome || "—"}</div><div><strong style="color:${C.brownDark}">E-mail:</strong> ${d.email || "—"}</div><div><strong style="color:${C.brownDark}">Telefone:</strong> ${d.telefone || "—"}</div><div><strong style="color:${C.brownDark}">Plano:</strong> ${d.plano || "—"} · R$ ${d.valor || "—"}/mês</div><div><strong style="color:${C.brownDark}">Café:</strong> ${d.cafe || "Surpresa"} · <strong style="color:${C.brownDark}">Moagem:</strong> ${d.moagem || "—"}</div><div><strong style="color:${C.brownDark}">Despachar até:</strong> ${d.despacharAte || "—"}</div></div>`)}${
            d.endereco
              ? box(`<div style="font-size:13px;color:${C.brown};line-height:1.7"><strong style="color:${C.brownDark}">Endereço:</strong><br>${d.endereco}</div>`)
              : `<div style="background:#FFF3F0;border:1px solid #E0A090;border-radius:10px;padding:18px 20px;margin:18px 0;font-size:14px;color:#8A3A28"><strong>⚠️ SEM ENDEREÇO</strong> — pedido de endereço enviado ao cliente.</div>`
          }${btn(`${SITE}/admin/assinaturas`, "Abrir no admin")}`,
          `Nova assinatura ${d.plano || ""}`
        ),
      };
    case "admin_notification_failed":
      return {
        subject: "⚠️ Falha ao enviar notificação",
        html: shell(
          "Falha de notificação",
          `${h("Uma notificação não saiu")}${box(`<div style="font-size:14px;color:${C.brown};line-height:1.9"><div><strong style="color:${C.brownDark}">Tipo:</strong> ${d.tipo || "—"}</div><div><strong style="color:${C.brownDark}">Destinatário:</strong> ${d.destinatario || "—"}</div><div><strong style="color:${C.brownDark}">Erro:</strong> ${String(d.erro || "").slice(0, 300)}</div></div>`)}${p("Reenvie manualmente pelo painel de assinaturas.")}${btn(`${SITE}/admin/assinaturas`, "Abrir no admin")}`,
          "Uma notificação falhou."
        ),
      };
    case "admin_reconciliation":
      return {
        subject: `Resumo diário das assinaturas — ${d.data || ""}`,
        html: shell(
          "Resumo diário",
          `${h("Como estão as assinaturas hoje")}${box(`<div style="font-size:14px;color:${C.brown};line-height:1.9"><div><strong style="color:${C.brownDark}">Ativas:</strong> ${d.ativas ?? 0}</div><div><strong style="color:${C.brownDark}">Sem endereço:</strong> ${d.semEndereco ?? 0}</div><div><strong style="color:${C.brownDark}">A despachar:</strong> ${d.aDespachar ?? 0}</div><div><strong style="color:${C.brownDark}">Prazo vencido:</strong> ${d.vencidas ?? 0}</div><div><strong style="color:${C.brownDark}">E-mails reenviados:</strong> ${d.acoes ?? 0}</div></div>`)}${d.detalhes ? p(String(d.detalhes)) : ""}${btn(`${SITE}/admin/assinaturas`, "Abrir no admin")}`,
          "Resumo diário das assinaturas."
        ),
      };
    case "admin_ship_reminder":
      return {
        subject: `⏰ Despachar amanhã: ${d.quantidade ?? 0} assinatura(s) vencem em ${d.prazo || ""}`,
        html: shell(
          "Prazo de despacho amanhã",
          `${h("Amanhã é o último dia")}${p(`Estas entregas do Clube precisam sair até <strong>${d.prazo || "amanhã"}</strong>.`)}${box(`<div style="font-size:14px;color:${C.brown};line-height:1.9">${d.lista || "—"}</div>`)}${p("Ao registrar o despacho no painel, o cliente recebe o e-mail com o código de rastreio automaticamente.")}${btn(`${SITE}/admin/assinaturas`, "Registrar despacho")}`,
          `${d.quantidade ?? 0} entrega(s) vencem amanhã`
        ),
      };
  }
}


async function sendViaResend(to: string, subject: string, html: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    throw new Error("Missing LOVABLE_API_KEY or RESEND_API_KEY");
  }
  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Resend failed [${res.status}]: ${body}`);
    throw new Error(`Resend ${res.status}: ${body}`);
  }
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { type, to, data } = (await req.json()) as EmailRequest;
    if (!type || !to) {
      return new Response(JSON.stringify({ error: "type e to são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Rate-limit persistido (Postgres): 10 e-mails/min por destinatário + 30/min por IP
    const allowedTo = await checkRateLimit(`send-email:to:${to.toLowerCase()}`, 10, 60);
    const allowedIp = await checkRateLimit(callerKey(req, "send-email"), 30, 60);
    if (!allowedTo || !allowedIp) {
      return new Response(JSON.stringify({ error: "Rate limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const rendered = render(type, data || {});
    if (!rendered) {
      return new Response(JSON.stringify({ error: "Tipo inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const result = await sendViaResend(to, rendered.subject, rendered.html);
    console.log(`📧 [${type}] → ${to} · ${rendered.subject}`);
    return new Response(JSON.stringify({ success: true, id: result?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-email error:", error?.message || error);
    return new Response(JSON.stringify({ error: error?.message || "Erro ao enviar" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
