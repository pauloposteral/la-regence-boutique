import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, RefreshCcw, MessageCircle, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";

const MOTIVOS = [
  "O banco pode ter recusado por limite ou por segurança — vale tentar outro cartão.",
  "Confira número, validade e CVV; um dígito errado já barra a compra.",
  "No Pix, o código expira em alguns minutos — gere um novo.",
];

const PagamentoErroPage = () => {
  const [searchParams] = useSearchParams();
  const pedidoId = searchParams.get("pedido");

  return (
    <Layout>
      <SEOHead title="Pagamento não concluído" description="Seu pagamento não foi concluído. Veja como finalizar seu pedido na La Régence." />
      <div className="container mx-auto px-4 py-20 max-w-lg text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6"
        >
          <AlertCircle className="w-10 h-10 text-destructive" />
        </motion.div>

        <h1 className="font-display text-3xl font-semibold mb-3">Pagamento não concluído</h1>
        <p className="font-body text-sm text-muted-foreground mb-2">
          Nada foi cobrado e seu carrinho continua salvo. É só tentar de novo.
        </p>
        {pedidoId && (
          <p className="font-body text-xs text-muted-foreground mb-6">
            Pedido: <span className="font-mono text-gold">{pedidoId.slice(0, 8).toUpperCase()}</span>
          </p>
        )}

        <div className="bg-card border border-border rounded-xl p-5 text-left mb-8">
          <p className="font-body text-[10px] tracking-[0.2em] uppercase text-gold mb-3">O que costuma resolver</p>
          <ul className="space-y-2">
            {MOTIVOS.map((m) => (
              <li key={m} className="font-body text-sm text-muted-foreground leading-relaxed">• {m}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="rounded-full bg-gold text-white hover:bg-gold-dark font-body text-xs tracking-[0.2em] uppercase">
            <Link to="/checkout"><RefreshCcw className="w-4 h-4 mr-2" /> Tentar novamente</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full font-body text-xs tracking-[0.2em] uppercase">
            <Link to="/cafes"><ShoppingBag className="w-4 h-4 mr-2" /> Ver cafés</Link>
          </Button>
        </div>

        <a
          href="https://wa.me/5518996540883?text=Oi! Tive um problema no pagamento do meu pedido."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-body text-xs text-gold hover:underline mt-6"
        >
          <MessageCircle className="w-3.5 h-3.5" /> Falar com a gente no WhatsApp
        </a>
      </div>
    </Layout>
  );
};

export default PagamentoErroPage;
