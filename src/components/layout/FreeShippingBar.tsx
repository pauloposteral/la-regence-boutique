import { motion } from "framer-motion";
import { Truck } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const FRETE_GRATIS_MIN = 150;

const FreeShippingBar = () => {
  const { subtotal, totalItems } = useCart();

  if (totalItems === 0) return null;

  const falta = Math.max(0, FRETE_GRATIS_MIN - subtotal);
  const progresso = Math.min(100, (subtotal / FRETE_GRATIS_MIN) * 100);

  return (
    <div className="bg-cream-200 border-b border-cream-400 py-2">
      <div className="container mx-auto px-4 lg:px-8 flex items-center gap-3">
        <Truck className="w-4 h-4 text-gold shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between text-[11px] font-body mb-1">
            {falta > 0 ? (
              <span className="text-brown-light">
                Faltam <strong className="text-brown-dark">R$ {falta.toFixed(2).replace(".", ",")}</strong> para frete grátis
              </span>
            ) : (
              <span className="text-gold font-medium">🎉 Você ganhou frete grátis!</span>
            )}
          </div>
          <div className="w-full h-1 bg-cream-400 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gold rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progresso}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeShippingBar;
