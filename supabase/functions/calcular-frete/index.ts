import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Business constants
const CEP_ORIGEM = "16901100"; // Andradina/SP
const PESO_PADRAO_KG = 0.25; // 250g padrão
const CAIXA = { width: 11, height: 6, length: 16 }; // cm
const FRETE_GRATIS_MIN = 150;
const FRETE_GRATIS_SP_MIN = 100;

const ME_BASE = "https://melhorenvio.com.br/api/v2";
const UA = "La Regence Cafes (contato@cafelaregence.com.br)";

type IncomingItem = {
  produtoId?: string;
  varianteId?: string | null;
  quantidade: number;
  preco?: number;
};

type MEProduct = {
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number; // kg
  insurance_value: number;
  quantity: number;
};

function onlyDigits(s: string): string {
  return (s || "").replace(/\D/g, "");
}

function isSPState(uf?: string) {
  return (uf || "").toUpperCase() === "SP";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("MELHOR_ENVIO_TOKEN");
    if (!token) throw new Error("MELHOR_ENVIO_TOKEN não configurado");

    const body = await req.json().catch(() => ({}));
    const cepDestinoRaw: string = body.cep_destino || body.cep || "";
    const cepDestino = onlyDigits(cepDestinoRaw);
    if (cepDestino.length !== 8) throw new Error("CEP de destino inválido");

    const uf: string | undefined = body.estado;
    const items: IncomingItem[] = Array.isArray(body.items) ? body.items : [];
    const subtotalCliente: number = Number(body.subtotal) || 0;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ==== Build products array ====
    let meProducts: MEProduct[] = [];
    let subtotalServidor = 0;

    if (items.length > 0) {
      const produtoIds = [...new Set(items.map((i) => i.produtoId).filter(Boolean) as string[])];
      const varianteIds = items.map((i) => i.varianteId).filter(Boolean) as string[];

      const { data: produtos } = await supabaseAdmin
        .from("produtos")
        .select("id, preco, preco_promocional, peso_padrao")
        .in("id", produtoIds);

      let variantes: any[] = [];
      if (varianteIds.length > 0) {
        const { data: v } = await supabaseAdmin
          .from("variantes")
          .select("id, preco, peso, produto_id")
          .in("id", varianteIds);
        variantes = v || [];
      }

      const prodMap = new Map((produtos || []).map((p: any) => [p.id, p]));
      const varMap = new Map(variantes.map((v: any) => [v.id, v]));

      items.forEach((item, idx) => {
        const p: any = item.produtoId ? prodMap.get(item.produtoId) : null;
        if (!p) return;
        let pesoKg = Number(p.peso_padrao) || PESO_PADRAO_KG;
        let preco = Number(p.preco_promocional ?? p.preco) || 0;
        if (item.varianteId) {
          const v: any = varMap.get(item.varianteId);
          if (v) {
            if (v.peso) pesoKg = Number(v.peso);
            if (v.preco) preco = Number(v.preco);
          }
        }
        // Normalizar peso: se vier em gramas (>10) converter
        if (pesoKg > 10) pesoKg = pesoKg / 1000;
        subtotalServidor += preco * item.quantidade;
        meProducts.push({
          id: String(idx + 1),
          width: CAIXA.width,
          height: CAIXA.height,
          length: CAIXA.length,
          weight: Number(pesoKg.toFixed(3)),
          insurance_value: Number((preco * item.quantidade).toFixed(2)),
          quantity: item.quantidade,
        });
      });
    }

    // Fallback: quando não vieram itens (ShippingCalculator da PDP)
    if (meProducts.length === 0) {
      const pesoKg = Number(body.peso_kg) || PESO_PADRAO_KG;
      const valor = Number(body.valor_declarado) || 50;
      meProducts.push({
        id: "1",
        width: CAIXA.width,
        height: CAIXA.height,
        length: CAIXA.length,
        weight: pesoKg,
        insurance_value: valor,
        quantity: Number(body.quantidade) || 1,
      });
    }

    const subtotalEfetivo = subtotalServidor > 0 ? subtotalServidor : subtotalCliente;

    // ==== Call Melhor Envio ====
    const meRes = await fetch(`${ME_BASE}/me/shipment/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": UA,
      },
      body: JSON.stringify({
        from: { postal_code: CEP_ORIGEM },
        to: { postal_code: cepDestino },
        products: meProducts,
      }),
    });

    if (!meRes.ok) {
      const txt = await meRes.text();
      console.error("[calcular-frete] Melhor Envio erro", meRes.status, txt);
      return new Response(
        JSON.stringify({ error: "Erro ao consultar transportadoras", status: meRes.status, details: txt }),
        { status: meRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const raw = await meRes.json();
    const services = (Array.isArray(raw) ? raw : []).filter((s: any) => !s.error && s.price);

    // Free shipping rules
    const freteGratisGeral = subtotalEfetivo >= FRETE_GRATIS_MIN;
    const freteGratisSP = isSPState(uf) && subtotalEfetivo >= FRETE_GRATIS_SP_MIN;
    const isFreeShipping = freteGratisGeral || freteGratisSP;

    const options = services.map((s: any) => {
      const originalPrice = Number(s.price);
      return {
        id: String(s.id),
        name: s.name,
        company: s.company?.name || "",
        company_picture: s.company?.picture || null,
        delivery_time: Number(s.delivery_time) || null,
        delivery_range: s.delivery_range || null,
        price: isFreeShipping ? 0 : originalPrice,
        original_price: originalPrice,
        free: isFreeShipping,
      };
    });

    // Sort by price then delivery time
    options.sort((a, b) => a.price - b.price || (a.delivery_time || 99) - (b.delivery_time || 99));

    return new Response(
      JSON.stringify({
        cep_origem: CEP_ORIGEM,
        cep_destino: cepDestino,
        subtotal: subtotalEfetivo,
        free_shipping: isFreeShipping,
        free_shipping_reason: freteGratisGeral
          ? "acima_de_150"
          : freteGratisSP
          ? "sp_acima_de_100"
          : null,
        options,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[calcular-frete] erro", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro ao calcular frete" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
