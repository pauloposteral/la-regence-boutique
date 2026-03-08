import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, ShoppingBag, Home } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";

const PagamentoSucessoPage = () => {
  const { clearCart } = useCart();
  const [searchParams] = useSearchParams();
  const pedidoId = searchParams.get("pedido");

  useEffect(() => {
    clearCart();
  }, [clearCart]);

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
