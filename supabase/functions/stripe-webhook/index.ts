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

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log(`📨 Stripe event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const pedidoId = session.metadata?.pedido_id;
        if (!pedidoId) break;

        // Idempotency: skip if already processed
        const { data: existing } = await supabaseAdmin
          .from("pedidos")
          .select("id, status, stripe_payment_intent")
          .eq("id", pedidoId)
          .maybeSingle();

        if (!existing) {
          console.warn(`⚠️ Pedido ${pedidoId} não encontrado`);
          break;
        }

        if (existing.status === "pago" || existing.status === "confirmado") {
          console.log(`↩️ Pedido ${pedidoId} já processado (status=${existing.status})`);
          break;
        }

        // Update order status to "pago" (matches new enum)
        const { error: updErr } = await supabaseAdmin
          .from("pedidos")
          .update({
            status: "pago",
            stripe_payment_intent: session.payment_intent as string,
          })
          .eq("id", pedidoId);

        if (updErr) {
          console.error(`❌ Erro ao atualizar pedido ${pedidoId}:`, updErr.message);
          throw updErr;
        }
        console.log(`✅ Pedido ${pedidoId} marcado como pago`);

        // Decrement stock
        const { data: orderItems } = await supabaseAdmin
          .from("itens_pedido")
          .select("produto_id, variante_id, quantidade")
          .eq("pedido_id", pedidoId);

        if (orderItems) {
          for (const item of orderItems) {
            if (item.variante_id) {
              const { data: variante } = await supabaseAdmin
                .from("variantes")
                .select("estoque")
                .eq("id", item.variante_id)
                .maybeSingle();
              if (variante) {
                await supabaseAdmin
                  .from("variantes")
                  .update({ estoque: Math.max(0, variante.estoque - item.quantidade) })
                  .eq("id", item.variante_id);
              }
            }
            const { data: produto } = await supabaseAdmin
              .from("produtos")
              .select("estoque")
              .eq("id", item.produto_id)
              .maybeSingle();
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
            try {
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
            } catch (e: any) {
              console.error("⚠️ Falha ao enviar email de confirmação:", e.message);
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

      case "charge.refunded":
      case "payment_intent.payment_failed": {
        const obj: any = event.data.object;
        const piId = obj.payment_intent || obj.id;
        if (piId) {
          const newStatus = event.type === "charge.refunded" ? "reembolsado" : "cancelado";
          await supabaseAdmin
            .from("pedidos")
            .update({ status: newStatus })
            .eq("stripe_payment_intent", piId);
          console.log(`🔄 Pedido(s) com PI ${piId} → ${newStatus}`);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Webhook processing error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
