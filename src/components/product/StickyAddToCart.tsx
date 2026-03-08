import { useState, useEffect } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface StickyAddToCartProps {
  productName: string;
  price: number;
  pixPrice: number;
  onAddToCart: () => void;
  disabled?: boolean;
}

const StickyAddToCart = ({ productName, price, pixPrice, onAddToCart, disabled }: StickyAddToCartProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Show after scrolling past 400px
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="fixed bottom-14 lg:bottom-0 left-0 right-0 z-40 lg:hidden bg-background/98 backdrop-blur-lg border-t border-border px-4 py-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold truncate">{productName}</p>
              <p className="text-xs font-body text-accent font-medium">
                R$ {pixPrice.toFixed(2).replace(".", ",")} no Pix
              </p>
            </div>
            <Button
              size="sm"
              className="font-body text-xs shrink-0 btn-hover"
              onClick={onAddToCart}
              disabled={disabled}
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-1" />
              R$ {price.toFixed(2).replace(".", ",")}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyAddToCart;
