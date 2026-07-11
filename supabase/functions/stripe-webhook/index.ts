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

        // Send confirmation email (customer) + notification (owner)
        const { data: pedido } = await supabaseAdmin
          .from("pedidos")
          .select("*, itens_pedido(count)")
          .eq("id", pedidoId)
          .single();

        if (pedido) {
          const email = pedido.email_visitante || session.customer_email;
          const totalFmt = Number(pedido.total).toFixed(2).replace(".", ",");
          const paymentMethod = pedido.metodo_pagamento === "pix" ? "Pix" : "Cartão";
          const itemCount = pedido.itens_pedido?.[0]?.count || 0;

          if (email) {
            try {
              await supabaseAdmin.functions.invoke("send-email", {
                body: {
                  type: "order_confirmation",
                  to: email,
                  data: { orderId: pedidoId, total: totalFmt, paymentMethod, itemCount },
                },
              });
            } catch (e: any) {
              console.error("⚠️ Falha ao enviar email de confirmação:", e.message);
            }
          }

          // Notify the store owner
          const ownerEmail = Deno.env.get("OWNER_EMAIL") || "pauloposteral@hotmail.com";
          try {
            await supabaseAdmin.functions.invoke("send-email", {
              body: {
                type: "admin_new_order",
                to: ownerEmail,
                data: {
                  orderId: pedidoId,
                  total: totalFmt,
                  paymentMethod,
                  itemCount,
                  customerEmail: email || "—",
                  customerName: pedido.nome_cliente || pedido.nome_visitante || "",
                },
              },
            });
          } catch (e: any) {
            console.error("⚠️ Falha ao notificar dono:", e.message);
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

      // ===== Subscription lifecycle (Clube La Régence) =====
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const meta = sub.metadata || {};
        const userId = meta.user_id;
        if (!userId) {
          console.warn(`⚠️ Subscription ${sub.id} sem user_id no metadata`);
          break;
        }

        const priceId = sub.items.data[0]?.price.id;
        const unitAmount = sub.items.data[0]?.price.unit_amount || 0;
        const statusMap: Record<string, "ativa" | "pausada" | "cancelada"> = {
          active: "ativa", trialing: "ativa", past_due: "ativa",
          paused: "pausada",
          canceled: "cancelada", incomplete_expired: "cancelada", unpaid: "cancelada",
        };
        const localStatus = statusMap[sub.status] || "cancelada";
        // current_period_end may be undefined in older typings — fallback safe
        const periodEndUnix = (sub as any).current_period_end as number | undefined;
        const proxima = periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null;
        const cancelaEm = sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null;

        const { data: existing } = await supabaseAdmin
          .from("assinaturas")
          .select("id")
          .eq("stripe_subscription_id", sub.id)
          .maybeSingle();

        const payload = {
          user_id: userId,
          tipo: (meta.tipo || "mensal") as any,
          preco: unitAmount / 100,
          moagem: (meta.moagem || "media") as any,
          cafe_surpresa: meta.cafe_surpresa === "true",
          produto_id: meta.produto_id || null,
          stripe_subscription_id: sub.id,
          stripe_price_id: priceId,
          status: localStatus,
          proxima_entrega: proxima,
          cancela_em: cancelaEm,
        };

        if (existing) {
          await supabaseAdmin.from("assinaturas")
            .update({ status: payload.status, proxima_entrega: payload.proxima_entrega, cancela_em: payload.cancela_em, stripe_price_id: payload.stripe_price_id, preco: payload.preco })
            .eq("id", existing.id);
          console.log(`🔁 Assinatura ${sub.id} atualizada (${localStatus})`);
        } else {
          await supabaseAdmin.from("assinaturas").insert(payload);
          console.log(`✨ Assinatura ${sub.id} criada para user ${userId}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabaseAdmin
          .from("assinaturas")
          .update({ status: "cancelada", cancela_em: new Date().toISOString() })
          .eq("stripe_subscription_id", sub.id);
        console.log(`🛑 Assinatura ${sub.id} cancelada`);
        break;
      }

      case "invoice.paid": {
        const inv = event.data.object as Stripe.Invoice;
        const subId = (inv as any).subscription as string | undefined;
        if (subId) {
          // Push next delivery 30 days out (best-effort; precise date virá do próximo subscription.updated)
          await supabaseAdmin
            .from("assinaturas")
            .update({ proxima_entrega: new Date(Date.now() + 30 * 86400000).toISOString() })
            .eq("stripe_subscription_id", subId);
          console.log(`💳 Invoice paga, próxima entrega atualizada para sub ${subId}`);
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
