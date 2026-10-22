import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimit, callerKey } from "../_shared/rateLimit.ts";
import { requireAmount, allocateCheckoutCents, amountCents, checkoutTotals } from "../_shared/checkoutAmounts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// === Server-side business rules (single source of truth) ===
const FALLBACK_FRETE_GRATIS_MIN = 150; // usado apenas se a tabela regras_frete_gratis estiver vazia
const FRETE_FALLBACK = 19.90;

async function isFreteGratisPorRegra(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  subtotal: number,
  uf?: string,
): Promise<{ free: boolean; nome: string | null }> {
  try {
    const { data } = await supabase
      .from("regras_frete_gratis")
      .select("nome, uf, valor_minimo")
      .eq("ativa", true);
    const regras = Array.isArray(data) ? data : [];
    if (regras.length === 0) {
      const ok = subtotal >= FALLBACK_FRETE_GRATIS_MIN;
      return { free: ok, nome: ok ? "Frete grátis Brasil" : null };
    }
    const ufUp = (uf || "").toUpperCase();
    const aplicaveis = regras
      .filter((r: any) => !r.uf || r.uf.toUpperCase() === ufUp)
        .filter((r: any) => subtotal >= requireAmount(r.valor_minimo))
      .sort((a: any, b: any) => Number(a.valor_minimo) - Number(b.valor_minimo));
    if (aplicaveis.length > 0) {
      return { free: true, nome: (aplicaveis[0] as { nome: string }).nome };
    }
    return { free: false, nome: null };
  } catch (e) {
    console.error("[create-checkout] isFreteGratisPorRegra erro", e);
    const ok = subtotal >= FALLBACK_FRETE_GRATIS_MIN;
    return { free: ok, nome: ok ? "Frete grátis Brasil" : null };
  }
}

// Melhor Envio (server-side revalidation)
const ME_BASE = "https://melhorenvio.com.br/api/v2";
const CEP_ORIGEM = "16901100";
const CAIXA = { width: 11, height: 6, length: 16 };
const PESO_PADRAO_KG = 0.25;
const UA_ME = "La Regence Cafes (contato@cafelaregence.com.br)";

function round2(n: number) {
  return amountCents(n) / 100;
}

async function calcularFreteServidor(
  cepDestino: string,
  produtos: Array<{ preco: number; peso_kg: number; quantidade: number }>,
): Promise<any[]> {
  const token = Deno.env.get("MELHOR_ENVIO_TOKEN");
  if (!token) return [];
  const meProducts = produtos.map((p, idx) => ({
    id: String(idx + 1),
    width: CAIXA.width,
    height: CAIXA.height,
    length: CAIXA.length,
    weight: Number((p.peso_kg || PESO_PADRAO_KG).toFixed(3)),
    insurance_value: Number((p.preco * p.quantidade).toFixed(2)),
    quantity: p.quantidade,
  }));
  try {
    const res = await fetch(`${ME_BASE}/me/shipment/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": UA_ME,
      },
      body: JSON.stringify({
        from: { postal_code: CEP_ORIGEM },
        to: { postal_code: cepDestino },
        products: meProducts,
      }),
    });
    if (!res.ok) {
      console.error("[create-checkout] ME erro", res.status, await res.text());
      return [];
    }
    const raw = await res.json();
    return (Array.isArray(raw) ? raw : []).filter((s: any) => !s.error && s.price);
  } catch (e) {
    console.error("[create-checkout] ME exception", e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limit: 10 checkout attempts / minute / IP (or user when authed)
    const rlKey = callerKey(req, "checkout");
    const allowed = await checkRateLimit(rlKey, 10, 60);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Muitas tentativas de pagamento. Aguarde 1 minuto e tente novamente." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      items,
      form,
      cupomCodigo,            // server validates the code, NOT the discount value
      metodoPagamento,
      freteServicoId,         // id do serviço Melhor Envio escolhido
      idempotencyKey,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Carrinho vazio");
    }
    if (!form?.email) {
      throw new Error("E-mail é obrigatório");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authenticated user (optional — guest checkout allowed)
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseAdmin.auth.getUser(token);
      userId = data.user?.id ?? null;
    }

    // === 1. Fetch authoritative prices from DB ===
    const produtoIds = [...new Set(items.map((i: any) => i.produtoId))];
    const varianteIds = items.filter((i: any) => i.varianteId).map((i: any) => i.varianteId);

    const { data: produtos, error: prodErr } = await supabaseAdmin
      .from("produtos")
      .select("id, nome, preco, preco_promocional, estoque, ativo, peso_padrao")
      .in("id", produtoIds);
    if (prodErr) throw prodErr;

    let variantes: any[] = [];
    if (varianteIds.length > 0) {
      const { data: v, error: varErr } = await supabaseAdmin
        .from("variantes")
        .select("id, preco, estoque, ativo, produto_id, peso")
        .in("id", varianteIds);
      if (varErr) throw varErr;
      variantes = v || [];
    }

    const prodMap = new Map((produtos || []).map((p: any) => [p.id, p]));
    const varMap = new Map(variantes.map((v: any) => [v.id, v]));

    // === 2. Recalculate subtotal + validate stock from server data ===
    let subtotal = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
      if (!Number.isSafeInteger(item.quantidade) || item.quantidade <= 0) throw new Error("Quantidade inválida");
      const produto = prodMap.get(item.produtoId);
      if (!produto || !produto.ativo) {
        throw new Error(`Produto indisponível: ${item.nome || item.produtoId}`);
      }

      let unitPrice: number;
      let stock: number;
      let pesoKg: number = Number(produto.peso_padrao) || PESO_PADRAO_KG;

      // Promoção é proporcional ao preço base — aplica o mesmo desconto à variante
      const basePrice = requireAmount(produto.preco);
      const offerPrice = produto.preco_promocional == null ? null : requireAmount(produto.preco_promocional);
      if (basePrice <= 0 || (offerPrice != null && offerPrice > basePrice)) throw new Error("Preço inválido");
      const promoRatio = offerPrice != null
        ? offerPrice / basePrice
        : null;

      if (item.varianteId) {
        const variante = varMap.get(item.varianteId);
        if (!variante || !variante.ativo || variante.produto_id !== produto.id) {
          throw new Error(`Variante indisponível para "${produto.nome}"`);
        }
        unitPrice = requireAmount(variante.preco);
        if (promoRatio != null && unitPrice !== offerPrice) unitPrice = round2(unitPrice * promoRatio);
        stock = variante.estoque;
        if (variante.peso) pesoKg = Number(variante.peso);
      } else {
        unitPrice = offerPrice ?? basePrice;
        stock = produto.estoque;
      }

      if (pesoKg > 10) pesoKg = pesoKg / 1000; // normaliza gramas → kg

      if (stock < item.quantidade) {
        throw new Error(`Estoque insuficiente para "${produto.nome}". Disponível: ${stock}`);
      }

      const lineSubtotal = round2(unitPrice * item.quantidade);
      subtotal += lineSubtotal;
      validatedItems.push({
        ...item,
        nome: produto.nome,
        unitPrice,
        pesoKg,
        lineSubtotal,
      });
    }

    subtotal = round2(subtotal);

    // === 3. Coupon — atomic redeem via SECURITY DEFINER function ===
    let cupomId: string | null = null;
    let desconto = 0;
    if (cupomCodigo && typeof cupomCodigo === "string" && cupomCodigo.trim().length > 0) {
      const { data: redeem, error: cupErr } = await supabaseAdmin.rpc("redeem_coupon", {
        _codigo: cupomCodigo.trim(),
        _subtotal: subtotal,
      });
      if (cupErr) throw cupErr;
      const r = Array.isArray(redeem) ? redeem[0] : redeem;
      if (!r || r.motivo !== "ok") {
        const reasonMap: Record<string, string> = {
          invalido: "Cupom inválido",
          expirado: "Cupom expirado",
          esgotado: "Cupom esgotado",
          valor_minimo: "Valor mínimo do cupom não atingido",
        };
        throw new Error(reasonMap[r?.motivo] || "Cupom inválido");
      }
      cupomId = r.cupom_id;
      desconto = requireAmount(r.desconto);
      if (desconto > subtotal) throw new Error("Desconto inválido");
    }

    // === 4. Pix discount (applied on subtotal-after-coupon) ===
    const isPix = metodoPagamento === "pix";
    const discounted = checkoutTotals(subtotal, desconto, 0, isPix);
    const pixDescontoValor = discounted.pixDiscount;
    const subtotalAposDescontos = discounted.merchandiseTotal;

    // === 3.b Coupon type ("desconto" | "frete_gratis") ===
    let cupomTipo: string | null = null;
    if (cupomId) {
      const { data: cupRow } = await supabaseAdmin
        .from("cupons")
        .select("tipo")
        .eq("id", cupomId)
        .maybeSingle();
      cupomTipo = (cupRow?.tipo as string) || "desconto";
    }
    const cupomZeraFrete = cupomTipo === "frete_gratis";

    // === 5. Server-side shipping — revalidate with Melhor Envio ===
    const { free: freteGratisAtingido, nome: regraFreteNome } = await isFreteGratisPorRegra(
      supabaseAdmin,
      subtotalAposDescontos,
      form?.estado,
    );

    let custoFrete = 0;
    let freteNomeServico = cupomZeraFrete
      ? `Frete Grátis (cupom ${cupomCodigo})`
      : regraFreteNome || "Frete Grátis";

    if (!freteGratisAtingido && !cupomZeraFrete) {
      const cepDestino = (form?.cep || "").replace(/\D/g, "");
      if (cepDestino.length !== 8) throw new Error("CEP inválido");

      const produtosParaFrete = validatedItems.map((i: any) => ({
        preco: i.unitPrice,
        peso_kg: i.pesoKg,
        quantidade: i.quantidade,
      }));
      const opcoes = await calcularFreteServidor(cepDestino, produtosParaFrete);

      if (opcoes.length === 0) {
        custoFrete = FRETE_FALLBACK;
        freteNomeServico = "Envio padrão";
      } else {
        const escolhido = freteServicoId
          ? opcoes.find((o: any) => String(o.id) === String(freteServicoId))
          : null;
        const selecionado = escolhido || opcoes.sort(
          (a: any, b: any) => Number(a.price) - Number(b.price)
        )[0];
        custoFrete = round2(requireAmount(selecionado.price));
        freteNomeServico = `${selecionado.company?.name || selecionado.company || ""} · ${selecionado.name}`.trim();
      }
    }

    const total = checkoutTotals(subtotal, desconto, custoFrete, isPix).total;

    // === 6. Create order with server-validated values ===
    const { data: pedido, error: pedidoError } = await supabaseAdmin
      .from("pedidos")
      .insert({
        user_id: userId,
        email_visitante: userId ? null : form.email,
        subtotal,
        desconto: round2(desconto + pixDescontoValor),
        frete: custoFrete,
        total,
        metodo_pagamento: isPix ? "pix" : "card",
        presente: form.presente || false,
        mensagem_presente: form.mensagemPresente || null,
        endereco_entrega: {
          cep: form.cep,
          logradouro: form.logradouro,
          numero: form.numero,
          complemento: form.complemento,
          bairro: form.bairro,
          cidade: form.cidade,
          estado: form.estado,
        },
        cupom_id: cupomId,
      })
      .select("id")
      .single();
    if (pedidoError) throw pedidoError;

    const itensInsert = validatedItems.map((item: any) => ({
      pedido_id: pedido.id,
      produto_id: item.produtoId,
      variante_id: item.varianteId || null,
      quantidade: item.quantidade,
      preco_unitario: item.unitPrice,
      subtotal: item.lineSubtotal,
    }));

    const { error: itensError } = await supabaseAdmin.from("itens_pedido").insert(itensInsert);
    if (itensError) throw itensError;

    // === 7. Stripe session — line items use server-validated prices ===
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    const allocatedCents = allocateCheckoutCents(validatedItems, subtotalAposDescontos);
    const lineItems = validatedItems.map((item: any, index: number) => {
      return {
        price_data: {
          currency: "brl",
          product_data: {
            name: item.nome,
            description: [`Quantidade: ${item.quantidade}`, item.moagem ? `Moagem: ${item.moagem}` : ""].filter(Boolean).join(" · "),
          },
          unit_amount: allocatedCents[index],
        },
        quantity: 1,
      };
    });

    if (custoFrete > 0) {
      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: { name: "Frete", description: "Entrega do pedido" },
          unit_amount: amountCents(custoFrete),
        },
        quantity: 1,
      });
    }

    const FALLBACK_ORIGIN = "https://www.cafelaregence.com.br";
    const reqOrigin = req.headers.get("origin") || "";
    const allowedOrigin =
      /^https:\/\/(www\.)?cafelaregence\.com\.br$/.test(reqOrigin) ||
      /^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(reqOrigin) ||
      /^http:\/\/localhost(:\d+)?$/.test(reqOrigin);
    const origin = allowedOrigin ? reqOrigin : FALLBACK_ORIGIN;

    const sessionConfig: any = {
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/pagamento-sucesso?pedido=${pedido.id}`,
      cancel_url: `${origin}/pagamento-erro?pedido=${pedido.id}`,
      metadata: { pedido_id: pedido.id },
      payment_method_types: isPix ? ["pix"] : ["card"],
      ...(isPix ? { payment_method_options: { pix: { expires_after_seconds: 3600 } } } : {}),
      customer_email: form.email,
    };

    const session = await stripe.checkout.sessions.create(
      sessionConfig,
      idempotencyKey ? { idempotencyKey } : undefined
    );

    await supabaseAdmin
      .from("pedidos")
      .update({ stripe_session_id: session.id })
      .eq("id", pedido.id);

    return new Response(
      JSON.stringify({
        url: session.url,
        pedidoId: pedido.id,
        // Echo server-validated values so client can reconcile if needed
        validated: { subtotal, desconto, pixDesconto: pixDescontoValor, frete: custoFrete, total },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
