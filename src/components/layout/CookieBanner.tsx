import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const COOKIE_KEY = "laregence_cookie_consent";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_KEY);
      if (!consent) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try { localStorage.setItem(COOKIE_KEY, "accepted"); } catch {}
    setVisible(false);
  };

  const reject = () => {
    try { localStorage.setItem(COOKIE_KEY, "rejected"); } catch {}
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[60] p-4 lg:p-6"
        >
          <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl shadow-2xl shadow-black/10 p-5 lg:p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                <Cookie className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-sm font-semibold mb-1">Privacidade & Cookies</h3>
                <p className="font-body text-xs text-muted-foreground leading-relaxed">
                  Utilizamos cookies para melhorar sua experiência de navegação e personalizar conteúdos. Ao continuar, você concorda com nossa{" "}
                  <Link to="/politica-privacidade" className="text-gold hover:underline">Política de Privacidade</Link>.
                </p>
              </div>
              <button onClick={reject} className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-end gap-3 mt-4">
              <Button variant="outline" size="sm" className="font-body text-xs rounded-full" onClick={reject}>
                Rejeitar
              </Button>
              <Button size="sm" className="font-body text-xs bg-gold text-white hover:bg-gold-dark rounded-full" onClick={accept}>
                Aceitar cookies
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
