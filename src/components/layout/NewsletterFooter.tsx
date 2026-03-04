import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";

const emailSchema = z.string().email("E-mail inválido");

const NewsletterFooter = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const subscribe = async () => {
    const result = emailSchema.safeParse(email.trim());
    if (!result.success) { toast.error("Digite um e-mail válido"); return; }
    setLoading(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: result.data });
    setLoading(false);
    if (error?.code === "23505") { toast.info("Este e-mail já está inscrito!"); return; }
    if (error) { toast.error("Erro ao inscrever"); return; }
    toast.success("Inscrito com sucesso! ☕");
    setEmail("");
  };

  return (
    <div className="mt-8 pt-8 border-t border-primary-foreground/10">
      <div className="max-w-md mx-auto text-center">
        <h4 className="font-display text-lg font-semibold mb-2">Receba novidades</h4>
        <p className="text-xs text-primary-foreground/60 font-body mb-4">
          Dicas de preparo, lançamentos e promoções exclusivas.
        </p>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 font-body text-sm"
            onKeyDown={(e) => e.key === "Enter" && subscribe()}
          />
          <Button
            onClick={subscribe}
            disabled={loading}
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-xs shrink-0"
          >
            {loading ? "..." : "Inscrever"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewsletterFooter;
