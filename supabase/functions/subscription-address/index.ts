// Página pública "Falta só o endereço": valida o token de uso único e grava
// o endereço na assinatura, liberando o ciclo para torra (FEAT-007).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { adminClient, notify, notifyAdmins } from "../_shared/notify.ts";
import { hashToken, planLabel, brl, MOAGEM_LABELS, formatEndereco, formatDateBR, getCustomer } from "../_shared/subscriptions.ts";
import { shipByDate, formatShipBy } from "../_shared/businessDays.ts";
import { checkRateLimit, callerKey } from "../_shared/rateLimit.ts";

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

interface Endereco {
  destinatario?: string;
  telefone?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  referencia?: string;
}

function validate(e: Endereco): string | null {
  const cep = String(e.cep || "").replace(/\D/g, "");
  if (cep.length !== 8) return "CEP inválido";
  if (!e.logradouro?.trim()) return "Informe a rua";
  if (!e.numero?.trim()) return "Informe o número (use s/n se não houver)";
  if (!e.bairro?.trim()) return "Informe o bairro";
  if (!e.cidade?.trim()) return "Informe a cidade";
  if (!e.estado?.trim() || e.estado.trim().length !== 2) return "UF inválida";
  if (!e.destinatario?.trim()) return "Informe quem vai receber";
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const allowed = await checkRateLimit(callerKey(req, "sub-address"), 20, 60);
    if (!allowed) return json({ error: "Muitas tentativas. Aguarde 1 minuto." }, 429);

    const { token, endereco } = await req.json().catch(() => ({}));
    if (!token || typeof token !== "string") return json({ error: "Link inválido" }, 400);

    const supabase = adminClient();
    const hash = await hashToken(token);

    const { data: tokenRow } = await supabase
      .from("action_tokens")
      .select("*")
      .eq("token_hash", hash)
      .eq("purpose", "subscription_address")
      .maybeSingle();

    if (!tokenRow) return json({ error: "invalid", message: "Link inválido." }, 404);
    if ((tokenRow as any).used_at) return json({ error: "used", message: "Este link já foi usado." }, 410);
    if (new Date((tokenRow as any).expires_at) < new Date())
      return json({ error: "expired", message: "Este link expirou." }, 410);

    const { data: assinatura } = await supabase
      .from("assinaturas")
      .select("*, produtos(nome)")
      .eq("id", (tokenRow as any).assinatura_id)
      .maybeSingle();
    if (!assinatura) return json({ error: "invalid", message: "Assinatura não encontrada." }, 404);

    const a = assinatura as any;
    const customer = await getCustomer(a.user_id);

    // GET (sem endereço no corpo): só devolve o mínimo para montar a tela.
    if (!endereco) {
      return json({
        ok: true,
        plano: planLabel(a.tipo),
        primeiroNome: customer.primeiroNome,
        jaTemEndereco: !!a.endereco_entrega,
      });
    }

    const erro = validate(endereco as Endereco);
    if (erro) return json({ error: "validation", message: erro }, 400);

    const e = endereco as Endereco;
    const snapshot = {
      destinatario: e.destinatario!.trim(),
      cep: String(e.cep).replace(/\D/g, ""),
      logradouro: e.logradouro!.trim(),
      numero: e.numero!.trim(),
      complemento: e.complemento?.trim() || null,
      bairro: e.bairro!.trim(),
      cidade: e.cidade!.trim(),
      estado: e.estado!.trim().toUpperCase(),
      referencia: e.referencia?.trim() || null,
    };

    // Salva também no cadastro do cliente
    const { data: novoEndereco } = await supabase
      .from("enderecos")
      .insert({
        user_id: a.user_id,
        apelido: "Assinatura",
        cep: snapshot.cep,
        logradouro: snapshot.logradouro,
        numero: snapshot.numero,
        complemento: snapshot.complemento,
        bairro: snapshot.bairro,
        cidade: snapshot.cidade,
        estado: snapshot.estado,
      })
      .select("id")
      .maybeSingle();

    await supabase
      .from("assinaturas")
      .update({
        endereco_entrega: snapshot,
        endereco_id: (novoEndereco as any)?.id ?? null,
        telefone_contato: e.telefone || a.telefone_contato,
      })
      .eq("id", a.id);

    const despacharAte = shipByDate(new Date(), 3);
    const { data: ciclos } = await supabase
      .from("assinatura_ciclos")
      .select("id")
      .eq("assinatura_id", a.id)
      .in("status", ["awaiting_address", "problem"]);

    for (const c of ciclos || []) {
      await supabase
        .from("assinatura_ciclos")
        .update({
          status: "ready_to_ship",
          endereco_snapshot: snapshot,
          despachar_ate: despacharAte,
        })
        .eq("id", (c as any).id);
    }

    await supabase.from("action_tokens").update({ used_at: new Date().toISOString() }).eq("id", (tokenRow as any).id);

    const base = {
      nome: customer.primeiroNome,
      plano: planLabel(a.tipo),
      valor: brl(a.preco),
      cafe: a.cafe_surpresa ? "Surpresa (curadoria)" : a.produtos?.nome || "Café fixo",
      moagem: MOAGEM_LABELS[a.moagem] || a.moagem,
      proximaCobranca: formatDateBR(a.proxima_entrega),
      endereco: formatEndereco(snapshot),
      despacharAte: formatShipBy(despacharAte),
    };

    if (customer.email) {
      await notify({
        type: "subscription_confirmed",
        to: customer.email,
        data: { ...base, enderecoRecebido: true },
        assinaturaId: a.id,
      });
    }
    await notifyAdmins(
      "admin_new_subscription",
      { ...base, email: customer.email, telefone: e.telefone || customer.telefone },
      { assinaturaId: a.id }
    );

    return json({ ok: true, despacharAte: formatShipBy(despacharAte) });
  } catch (err) {
    console.error("subscription-address error", err);
    return json({ error: "server", message: err instanceof Error ? err.message : "Erro" }, 500);
  }
});
