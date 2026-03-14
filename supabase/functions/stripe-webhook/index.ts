import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
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

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  // If webhook secret is configured, verify signature
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // Fallback: parse without verification (dev mode)
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  console.log(`📨 Stripe event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const pedidoId = session.metadata?.pedido_id;

        if (pedidoId) {
          // Update order status to confirmed
          await supabaseAdmin
            .from("pedidos")
            .update({
              status: "confirmado",
              stripe_payment_intent: session.payment_intent as string,
            })
            .eq("id", pedidoId);

          console.log(`✅ Pedido ${pedidoId} confirmado`);

          // ==========================================
          // AUTO STOCK DECREMENT
          // ==========================================
          const { data: orderItems } = await supabaseAdmin
            .from("itens_pedido")
            .select("produto_id, variante_id, quantidade")
            .eq("pedido_id", pedidoId);

          if (orderItems) {
            for (const item of orderItems) {
              if (item.variante_id) {
                // Decrement variant stock
                const { data: variante } = await supabaseAdmin
                  .from("variantes")
                  .select("estoque")
                  .eq("id", item.variante_id)
                  .single();
                if (variante) {
                  await supabaseAdmin
                    .from("variantes")
                    .update({ estoque: Math.max(0, variante.estoque - item.quantidade) })
                    .eq("id", item.variante_id);
                }
              }
              // Always decrement product stock
              const { data: produto } = await supabaseAdmin
                .from("produtos")
                .select("estoque")
                .eq("id", item.produto_id)
                .single();
              if (produto) {
                await supabaseAdmin
                  .from("produtos")
                  .update({ estoque: Math.max(0, produto.estoque - item.quantidade) })
                  .eq("id", item.produto_id);
              }
            }
            console.log(`📦 Estoque decrementado para pedido ${pedidoId}`);
          }

          // Send confirmation email
          const { data: pedido } = await supabaseAdmin
            .from("pedidos")
            .select("*, itens_pedido(count)")
            .eq("id", pedidoId)
            .single();

          if (pedido) {
            const email = pedido.email_visitante || session.customer_email;
            if (email) {
              await supabaseAdmin.functions.invoke("send-email", {
                body: {
                  type: "order_confirmation",
                  to: email,
                  data: {
                    orderId: pedidoId,
                    total: Number(pedido.total).toFixed(2).replace(".", ","),
                    paymentMethod: pedido.metodo_pagamento === "pix" ? "Pix" : "Cartão",
                    itemCount: pedido.itens_pedido?.[0]?.count || 0,
                  },
                },
              });
            }
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const pedidoId = session.metadata?.pedido_id;
        if (pedidoId) {
          await supabaseAdmin
            .from("pedidos")
            .update({ status: "cancelado" })
            .eq("id", pedidoId)
            .eq("status", "pendente");
          console.log(`❌ Pedido ${pedidoId} cancelado (sessão expirada)`);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
