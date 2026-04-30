import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, ShoppingBag, Home } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { trackPurchase } from "@/lib/analytics";

const PagamentoSucessoPage = () => {
  const { clearCart } = useCart();
  const [searchParams] = useSearchParams();
  const pedidoId = searchParams.get("pedido");
  const trackedRef = useRef(false);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // Fire purchase event once per pedido (uses sessionStorage as idempotency guard)
  useEffect(() => {
    if (!pedidoId || trackedRef.current) return;
    const key = `purchase_tracked_${pedidoId}`;
    if (sessionStorage.getItem(key)) return;
    trackedRef.current = true;

    (async () => {
      const { data: pedido } = await supabase
        .from("pedidos")
        .select("total, itens_pedido(produto_id, quantidade, preco_unitario, produtos(nome))")
        .eq("id", pedidoId)
        .maybeSingle();
      if (!pedido) return;
      const items = (pedido.itens_pedido || []).map((it: any) => ({
        id: it.produto_id,
        name: it.produtos?.nome || "Produto",
        price: Number(it.preco_unitario),
        quantity: it.quantidade,
      }));
      trackPurchase(pedidoId, Number(pedido.total), items);
      sessionStorage.setItem(key, "1");
    })();
  }, [pedidoId]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 max-w-lg text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-10 h-10 text-gold" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="font-display text-3xl font-bold mb-3">Pagamento Confirmado!</h1>
          <p className="font-body text-muted-foreground mb-2">
            Seu pedido foi recebido com sucesso e está sendo processado.
          </p>
          {pedidoId && (
            <p className="font-body text-xs text-muted-foreground mb-8">
              Código do pedido: <span className="font-mono text-gold">{pedidoId.slice(0, 8)}</span>
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline" className="font-body rounded-none">
              <Link to="/"><Home className="w-4 h-4 mr-2" /> Voltar ao Início</Link>
            </Button>
            <Button asChild className="font-body bg-gold text-background hover:bg-gold-dark rounded-none uppercase tracking-wider">
              <Link to="/cafes"><ShoppingBag className="w-4 h-4 mr-2" /> Continuar Comprando</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default PagamentoSucessoPage;
