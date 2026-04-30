import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

type Status = "loading" | "ok" | "error";

const NewsletterConfirmPage = () => {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Link inválido. Token ausente.");
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("newsletter-confirm", {
          body: { token },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setStatus("ok");
        setMessage(data?.email ? `Inscrição confirmada para ${data.email}` : "Inscrição confirmada");
      } catch (e: any) {
        setStatus("error");
        setMessage(e?.message || "Não foi possível confirmar sua inscrição.");
      }
    })();
  }, [params]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-24 max-w-lg text-center">
        <div className="bg-card rounded-2xl border border-cream-300 p-10">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 text-gold mx-auto animate-spin mb-4" />
              <h1 className="font-display text-2xl text-brown-dark">Confirmando…</h1>
            </>
          )}
          {status === "ok" && (
            <>
              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4 border border-gold/30">
                <CheckCircle2 className="w-8 h-8 text-gold" />
              </div>
              <h1 className="font-display text-2xl text-brown-dark mb-2">Inscrição confirmada ☕</h1>
              <p className="font-body text-sm text-muted-foreground mb-6">{message}</p>
              <p className="font-body text-xs text-gold mb-6">
                Use o cupom <strong>BEMVINDO10</strong> para 10% off na sua primeira compra.
              </p>
              <Button asChild className="rounded-full bg-gold hover:bg-gold-dark text-white">
                <Link to="/cafes">Explorar cafés</Link>
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="font-display text-2xl text-brown-dark mb-2">Não foi possível confirmar</h1>
              <p className="font-body text-sm text-muted-foreground mb-6">{message}</p>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/">Voltar para o início</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NewsletterConfirmPage;
