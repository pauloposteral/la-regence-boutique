import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AddressForm, { emptyEndereco, validarEndereco, type EnderecoAssinatura } from "@/components/subscription/AddressForm";

type Screen = "loading" | "form" | "done" | "error";

const AssinaturaEnderecoPage = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [screen, setScreen] = useState<Screen>("loading");
  const [mensagem, setMensagem] = useState("");
  const [plano, setPlano] = useState<string | null>(null);
  const [nome, setNome] = useState<string | null>(null);
  const [despacharAte, setDespacharAte] = useState<string | null>(null);
  const [endereco, setEndereco] = useState<EnderecoAssinatura>(emptyEndereco);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      setScreen("error");
      setMensagem("Link inválido.");
      return;
    }
    (async () => {
      const { data } = await supabase.functions.invoke("subscription-address", { body: { token } });
      if (data?.ok) {
        setPlano(data.plano || null);
        setNome(data.primeiroNome || null);
        setScreen("form");
      } else {
        setMensagem(data?.message || "Não conseguimos abrir este link.");
        setScreen("error");
      }
    })();
  }, [token]);

  const salvar = async () => {
    const erro = validarEndereco(endereco);
    if (erro) { toast.error(erro); return; }
    setSaving(true);
    try {
      const { data } = await supabase.functions.invoke("subscription-address", {
        body: { token, endereco },
      });
      if (data?.ok) {
        setDespacharAte(data.despacharAte || null);
        setScreen("done");
      } else {
        toast.error(data?.message || "Não foi possível salvar. Tente de novo.");
      }
    } catch {
      toast.error("Não foi possível salvar. Tente de novo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <SEOHead title="Endereço de entrega" description="Informe o endereço de entrega da sua assinatura." />
      <section className="container mx-auto px-4 lg:px-8 py-16 lg:py-24 max-w-2xl">
        <div className="bg-card border border-cream-500 rounded-xl p-8 lg:p-10">
          {screen === "loading" && (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-4" />
              <p className="font-body text-sm text-muted-foreground">Abrindo seu link…</p>
            </div>
          )}

          {screen === "error" && (
            <div className="text-center py-10">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-5" />
              <h1 className="font-display text-2xl text-brown-dark mb-3">{mensagem}</h1>
              <p className="font-body text-sm text-muted-foreground mb-8">
                Fale com a gente em contato@cafelaregence.com.br que resolvemos em minutos.
              </p>
              <Button asChild variant="outline" className="rounded-full font-body text-xs tracking-[0.2em] uppercase">
                <Link to="/conta">Ir para minha conta</Link>
              </Button>
            </div>
          )}

          {screen === "form" && (
            <>
              <span className="font-body text-[11px] tracking-[0.3em] uppercase text-gold">Clube La Régence</span>
              <h1 className="font-display text-3xl text-brown-dark mt-2 mb-3">
                {nome ? `${nome}, falta só o endereço` : "Falta só o endereço"}
              </h1>
              <p className="font-body text-sm text-muted-foreground leading-relaxed mb-8">
                Sua assinatura {plano ? <strong className="text-brown-dark">{plano}</strong> : null} está confirmada.
                Assim que recebermos o endereço, seu café entra na fila de torra e sai em até 3 dias úteis.
              </p>
              <AddressForm value={endereco} onChange={setEndereco} disabled={saving} />
              <Button
                className="rounded-full bg-gold text-white hover:bg-gold-dark font-body text-xs tracking-[0.2em] uppercase px-8 mt-8 w-full sm:w-auto"
                onClick={salvar} disabled={saving}>
                {saving ? "Salvando…" : "Confirmar endereço"}
              </Button>
            </>
          )}

          {screen === "done" && (
            <div className="text-center py-10">
              <CheckCircle2 className="w-12 h-12 text-gold mx-auto mb-5" />
              <h1 className="font-display text-3xl text-brown-dark mb-3">Endereço recebido</h1>
              <p className="font-body text-sm text-muted-foreground leading-relaxed mb-8">
                Seu café já entrou na fila de torra{despacharAte ? <> e sai daqui até <strong className="text-brown-dark">{despacharAte}</strong></> : null},
                com código de rastreio por e-mail.
              </p>
              <Button asChild className="rounded-full bg-gold text-white hover:bg-gold-dark font-body text-xs tracking-[0.2em] uppercase px-8">
                <Link to="/conta?tab=assinatura">Minha assinatura</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default AssinaturaEnderecoPage;
