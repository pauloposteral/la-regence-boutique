import { useState, useEffect, useCallback } from "react";
import { X, Mail, Coffee } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email();
const STORAGE_KEY = "lr_newsletter_dismissed";
const DELAY_MS = 15000; // 15s before showing

const NewsletterPopup = () => {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  }, []);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 86400000) return;

    const timer = setTimeout(() => setVisible(true), DELAY_MS);

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) setVisible(true);
    };
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  const subscribe = async () => {
    if (!emailSchema.safeParse(email.trim()).success) {
      toast.error("Digite um e-mail válido");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim() });
    setLoading(false);
    if (error?.code === "23505") { toast.info("Este e-mail já está inscrito!"); dismiss(); return; }
    if (error) { toast.error("Erro ao inscrever"); return; }
    toast.success("Inscrito com sucesso! ☕ Você receberá nossas novidades.");
    dismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brown-deep/50 backdrop-blur-sm z-[60]"
            onClick={dismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] w-[90vw] max-w-md bg-card rounded-2xl shadow-2xl border border-cream-400 overflow-hidden"
          >
            {/* Gold accent bar */}
            <div className="h-1 bg-gradient-to-r from-gold/60 via-gold to-gold/60" />
            
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-cream-200 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-gold/20">
                <Coffee className="w-7 h-7 text-gold" />
              </div>
              <h3 className="font-display text-2xl font-semibold mb-2 text-brown-dark">
                Ganhe <span className="text-gradient-gold">10% OFF</span>
              </h3>
              <p className="font-body text-sm text-muted-foreground mb-6 leading-relaxed">
                Inscreva-se na newsletter e receba um cupom exclusivo de desconto na sua primeira compra.
              </p>

              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && subscribe()}
                  className="font-body text-sm rounded-full"
                  autoFocus
                />
                <Button
                  onClick={subscribe}
                  disabled={loading}
                  className="font-body text-sm shrink-0"
                >
                  {loading ? (
                    <span className="btn-spinner" />
                  ) : (
                    "Inscrever"
                  )}
                </Button>
              </div>

              <button
                onClick={dismiss}
                className="mt-4 text-xs font-body text-muted-foreground hover:text-foreground transition-colors"
              >
                Não, obrigado
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewsletterPopup;
