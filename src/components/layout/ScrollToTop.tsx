import { useState, useEffect, forwardRef } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MotionButton = motion.create(
  forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    (props, ref) => <button ref={ref} {...props} />
  )
);

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <MotionButton
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 left-6 lg:bottom-6 z-40 w-11 h-11 bg-card border border-cream-400 text-brown rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:border-gold/40 hover:text-gold transition-all"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-4 h-4" />
        </MotionButton>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTop;
