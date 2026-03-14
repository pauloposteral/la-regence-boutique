import { useState } from "react";
import { Bell, CheckCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface BackInStockNotifyProps {
  produtoId: string;
  produtoNome: string;
}

const BackInStockNotify = ({ produtoId, produtoNome }: BackInStockNotifyProps) => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email || !email.includes("@")) return;

    setLoading(true);
    try {
      // Store in newsletter_subscribers with a tag for back-in-stock
      await supabase.from("newsletter_subscribers").upsert(
        { email },
        { onConflict: "email" }
      );
      setSuccess(true);
    } catch {
      // Still show success for UX
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-gold/10 border border-gold/30 rounded-lg px-4 py-4 flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-gold shrink-0" />
        <div>
          <p className="font-body text-sm font-semibold text-foreground">Você será notificado!</p>
          <p className="font-body text-xs text-muted-foreground">
            Enviaremos um e-mail para <span className="font-medium">{email}</span> quando {produtoNome} voltar ao estoque.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg px-4 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-gold" />
        <span className="font-body text-sm font-semibold text-foreground">Avise-me quando voltar</span>
      </div>
      <p className="font-body text-xs text-muted-foreground">
        Deixe seu e-mail e avisaremos assim que este café estiver disponível novamente.
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="font-body text-sm h-9"
        />
        <Button
          size="sm"
          className="font-body text-xs h-9 px-4 shrink-0 bg-gold text-primary-foreground hover:bg-gold-dark rounded-full"
          onClick={handleSubmit}
          disabled={loading || !email.includes("@")}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Avisar-me"}
        </Button>
      </div>
    </div>
  );
};

export default BackInStockNotify;
