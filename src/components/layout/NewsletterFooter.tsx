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
    <div className="mt-10 pt-10 border-t border-cream-600/10">
      <div className="max-w-md mx-auto text-center">
        <h4 className="font-display text-lg font-semibold text-cream-200 mb-2">Receba novidades</h4>
        <p className="text-[11px] text-cream-600 font-body mb-4 tracking-wide">
          Dicas de preparo, lançamentos e promoções exclusivas.
        </p>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-cream-50/10 border-cream-600/20 text-cream-200 placeholder:text-cream-600 font-body text-sm rounded-full"
            onKeyDown={(e) => e.key === "Enter" && subscribe()}
          />
          <Button
            onClick={subscribe}
            disabled={loading}
            className="bg-gold text-white hover:bg-gold-dark font-body text-xs shrink-0 tracking-wider uppercase transition-all duration-300"
          >
            {loading ? "..." : "Inscrever"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewsletterFooter;
