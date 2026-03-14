import { useState, useEffect, forwardRef } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const PWAInstallPrompt = forwardRef<HTMLDivElement>((_, ref) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("lr_pwa_dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 30 * 86400000) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setVisible(true), 30000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setVisible(false);
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem("lr_pwa_dismissed", Date.now().toString());
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-16 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:max-w-sm z-50 bg-card border border-cream-400 rounded-2xl shadow-xl p-4"
        >
          <button onClick={dismiss} className="absolute top-2 right-2 p-1 hover:bg-cream-200 rounded-full transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center shrink-0 border border-gold/15">
              <Download className="w-5 h-5 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-semibold text-brown-dark">Instalar La Régence</p>
              <p className="text-[11px] font-body text-muted-foreground">Acesse mais rápido pela tela inicial</p>
            </div>
            <Button size="sm" className="font-body text-xs shrink-0" onClick={install}>
              Instalar
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

PWAInstallPrompt.displayName = "PWAInstallPrompt";

export default PWAInstallPrompt;
