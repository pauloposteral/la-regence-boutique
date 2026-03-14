import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

const CART_LAST_SEEN_KEY = "laregence_cart_last_seen";
const ABANDONED_THRESHOLD = 30 * 60 * 1000; // 30 minutes

/**
 * Shows a recovery banner when a user returns to the site
 * after 30+ minutes with items still in their cart.
 */
const AbandonedCartBanner = () => {
  const { items, totalItems, subtotal, openCart } = useCart();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (totalItems === 0) return;

    const lastSeen = localStorage.getItem(CART_LAST_SEEN_KEY);
    const now = Date.now();

    if (lastSeen) {
      const elapsed = now - Number(lastSeen);
      if (elapsed >= ABANDONED_THRESHOLD && !dismissed) {
        // User was away for 30+ min with items in cart
        setTimeout(() => setShow(true), 2000);
      }
    }

    // Update last seen timestamp periodically
    localStorage.setItem(CART_LAST_SEEN_KEY, String(now));
    const interval = setInterval(() => {
      localStorage.setItem(CART_LAST_SEEN_KEY, String(Date.now()));
    }, 60_000);

    return () => clearInterval(interval);
  }, [totalItems, dismissed]);

  // Clear when cart is emptied
  useEffect(() => {
    if (totalItems === 0) {
      setShow(false);
      localStorage.removeItem(CART_LAST_SEEN_KEY);
    }
  }, [totalItems]);

  const dismiss = () => {
    setShow(false);
    setDismissed(true);
  };

  const handleOpen = () => {
    openCart();
    dismiss();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-brown-deep via-brown-dark to-brown-deep text-cream-100 shadow-lg"
        >
          <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 text-gold" />
              </div>
              <div className="min-w-0">
                <p className="font-body text-sm font-medium truncate">
                  Você tem {totalItems} {totalItems === 1 ? "item" : "itens"} esperando no carrinho!
                </p>
                <p className="font-body text-[11px] text-cream-500">
                  R$ {subtotal.toFixed(2).replace(".", ",")} · Complete sua compra antes que acabe
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                className="bg-gold text-white hover:bg-gold-light font-body text-xs tracking-wider uppercase rounded-full gap-1.5"
                onClick={handleOpen}
              >
                Ver Carrinho <ArrowRight className="w-3.5 h-3.5" />
              </Button>
              <button
                onClick={dismiss}
                className="p-1.5 text-cream-500 hover:text-cream-100 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AbandonedCartBanner;
