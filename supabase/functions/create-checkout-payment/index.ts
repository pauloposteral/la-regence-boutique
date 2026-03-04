import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      items,
      form,
      subtotal,
      desconto,
      custoFrete,
      total,
      cupomId,
      metodoPagamento,
    } = await req.json();

    if (!items?.length) {
      throw new Error("Carrinho vazio");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check for authenticated user (optional - guest checkout allowed)
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseAdmin.auth.getUser(token);
      userId = data.user?.id ?? null;
    }

    const isPix = metodoPagamento === "pix";
    const pixDiscount = isPix ? 0.1 : 0;
    const subtotalAfterCoupon = Math.max(0, subtotal - (desconto || 0));
    const subtotalWithPix = isPix
      ? subtotalAfterCoupon * (1 - pixDiscount)
      : subtotalAfterCoupon;
    const finalTotal = Math.max(0, subtotalWithPix + (custoFrete || 0));

    // Create order
    const { data: pedido, error: pedidoError } = await supabaseAdmin
      .from("pedidos")
      .insert({
        user_id: userId,
        email_visitante: userId ? null : form.email,
        subtotal,
        desconto: (desconto || 0) + (isPix ? subtotalAfterCoupon * pixDiscount : 0),
        frete: custoFrete || 0,
        total: finalTotal,
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
        cupom_id: cupomId || null,
      })
      .select("id")
      .single();

    if (pedidoError) throw pedidoError;

    // Create order items
    const itens = items.map((item: any) => ({
      pedido_id: pedido.id,
      produto_id: item.produtoId,
      variante_id: item.varianteId || null,
      quantidade: item.quantidade,
      preco_unitario: item.precoPromocional || item.preco,
      subtotal: (item.precoPromocional || item.preco) * item.quantidade,
    }));

    const { error: itensError } = await supabaseAdmin
      .from("itens_pedido")
      .insert(itens);
    if (itensError) throw itensError;

    // Create Stripe session
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    const lineItems = items.map((item: any) => {
      let unitPrice = item.precoPromocional || item.preco;
      if (isPix) {
        unitPrice = unitPrice * (1 - pixDiscount);
      }
      return {
        price_data: {
          currency: "brl",
          product_data: {
            name: item.nome,
            ...(item.moagem ? { description: `Moagem: ${item.moagem}` } : {}),
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity: item.quantidade,
      };
    });

    // Add shipping as a line item if > 0
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

    const origin = req.headers.get("origin") || "https://lojalaregence.lovable.app";

    const sessionConfig: any = {
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/pagamento-sucesso?pedido=${pedido.id}`,
      cancel_url: `${origin}/checkout`,
      metadata: {
        pedido_id: pedido.id,
      },
    };

    if (isPix) {
      sessionConfig.payment_method_types = ["pix"];
    } else {
      sessionConfig.payment_method_types = ["card"];
    }

    if (form.email) {
      sessionConfig.customer_email = form.email;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Save stripe session id to order
    await supabaseAdmin
      .from("pedidos")
      .update({ stripe_session_id: session.id })
      .eq("id", pedido.id);

    return new Response(
      JSON.stringify({ url: session.url, pedidoId: pedido.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
