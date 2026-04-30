import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// === Server-side business rules (single source of truth) ===
const FRETE_GRATIS_MIN = 150;
const FRETE_PADRAO = 14.90;
const FRETE_EXPRESSO = 29.90;
const PIX_DISCOUNT = 0.10;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function calcularFrete(subtotalAposDesconto: number, modo: string, cidade?: string, estado?: string): number {
  // Free shipping: above threshold OR within São Paulo state
  const isSP = (estado || "").toUpperCase() === "SP";
  if (subtotalAposDesconto >= FRETE_GRATIS_MIN) return 0;
  if (isSP && subtotalAposDesconto >= 100) return 0; // SP gets free above R$100
  return modo === "expresso" ? FRETE_EXPRESSO : FRETE_PADRAO;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      items,
      form,
      cupomCodigo,            // server validates the code, NOT the discount value
      metodoPagamento,
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
      .select("id, nome, preco, preco_promocional, estoque, ativo")
      .in("id", produtoIds);
    if (prodErr) throw prodErr;

    let variantes: any[] = [];
    if (varianteIds.length > 0) {
      const { data: v, error: varErr } = await supabaseAdmin
        .from("variantes")
        .select("id, preco, estoque, ativo, produto_id")
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
      const produto = prodMap.get(item.produtoId);
      if (!produto || !produto.ativo) {
        throw new Error(`Produto indisponível: ${item.nome || item.produtoId}`);
      }

      let unitPrice: number;
      let stock: number;

      if (item.varianteId) {
        const variante = varMap.get(item.varianteId);
        if (!variante || !variante.ativo) {
          throw new Error(`Variante indisponível para "${produto.nome}"`);
        }
        unitPrice = Number(variante.preco);
        stock = variante.estoque;
      } else {
        unitPrice = Number(produto.preco_promocional ?? produto.preco);
        stock = produto.estoque;
      }

      if (stock < item.quantidade) {
        throw new Error(`Estoque insuficiente para "${produto.nome}". Disponível: ${stock}`);
      }

      const lineSubtotal = round2(unitPrice * item.quantidade);
      subtotal += lineSubtotal;
      validatedItems.push({
        ...item,
        nome: produto.nome,
        unitPrice,
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
      desconto = Number(r.desconto) || 0;
    }

    // === 4. Pix discount (applied on subtotal-after-coupon) ===
    const isPix = metodoPagamento === "pix";
    const subtotalAfterCoupon = Math.max(0, round2(subtotal - desconto));
    const pixDescontoValor = isPix ? round2(subtotalAfterCoupon * PIX_DISCOUNT) : 0;
    const subtotalAposDescontos = round2(subtotalAfterCoupon - pixDescontoValor);

    // === 5. Server-side shipping ===
    const custoFrete = calcularFrete(
      subtotalAposDescontos,
      form?.frete || "padrao",
      form?.cidade,
      form?.estado
    );

    const total = round2(subtotalAposDescontos + custoFrete);

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

    const lineItems = validatedItems.map((item: any) => {
      let unit = item.unitPrice;
      if (isPix) unit = unit * (1 - PIX_DISCOUNT);
      return {
        price_data: {
          currency: "brl",
          product_data: {
            name: item.nome,
            ...(item.moagem ? { description: `Moagem: ${item.moagem}` } : {}),
          },
          unit_amount: Math.round(unit * 100),
        },
        quantity: item.quantidade,
      };
    });

    if (custoFrete > 0) {
      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: { name: "Frete" },
          unit_amount: Math.round(custoFrete * 100),
        },
        quantity: 1,
      });
    }

    if (desconto > 0) {
      // Apply coupon discount as a negative adjustment via discounts isn't possible
      // with price_data; instead, we already discounted line items proportionally? No —
      // coupon comes off total. Stripe Checkout requires positive line items.
      // Simplest: prorate coupon across items.
      const ratio = (subtotal - desconto) / subtotal;
      for (const li of lineItems) {
        if (li.price_data.product_data.name === "Frete") continue;
        li.price_data.unit_amount = Math.round(li.price_data.unit_amount * ratio);
      }
    }

    const origin = req.headers.get("origin") || "https://lojalaregence.lovable.app";

    const sessionConfig: any = {
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/pagamento-sucesso?pedido=${pedido.id}`,
      cancel_url: `${origin}/checkout`,
      metadata: { pedido_id: pedido.id },
      payment_method_types: ["card"],
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
