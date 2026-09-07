import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, AlertCircle, Loader2, Mail } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Status {
  state: "confirmed" | "processing" | "pending" | "failed";
  plano: string | null;
  valor: string | null;
  cafe: string | null;
  moagem: string | null;
  proximaCobranca: string | null;
  endereco: any;
  despacharAte: string | null;
  email: string | null;
}

const AssinaturaSucessoPage = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const tries = useRef(0);

  useEffect(() => {
    let timer: number | undefined;
    const load = async () => {
      const { data } = await supabase.functions.invoke("subscription-status", { body: { sessionId } });
      if (data && !data.error) setStatus(data as Status);
      setLoading(false);
      tries.current += 1;
      // Enquanto o pagamento está sendo confirmado, tentamos de novo por até ~1min.
      if ((!data || data.state !== "confirmed") && tries.current < 12) {
        timer = window.setTimeout(load, 5000);
      }
    };
    load();
    return () => { if (timer) window.clearTimeout(timer); };
  }, [sessionId]);

  const endereco = status?.endereco;
  const enderecoTexto = endereco
    ? [`${endereco.logradouro}, ${endereco.numero}${endereco.complemento ? ` — ${endereco.complemento}` : ""}`,
       `${endereco.bairro} — ${endereco.cidade}/${endereco.estado}`,
       `CEP ${endereco.cep}`].join(" · ")
    : null;

  return (
    <Layout>
      <SEOHead title="Assinatura confirmada" description="Sua assinatura do Clube La Régence." />
      <section className="container mx-auto px-4 lg:px-8 py-16 lg:py-24 max-w-2xl">
        {loading && (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-4" />
            <p className="font-body text-sm text-muted-foreground">Confirmando seu pagamento…</p>
          </div>
        )}

        {!loading && status && (
          <div className="bg-card border border-cream-500 rounded-xl p-8 lg:p-10">
            {status.state === "confirmed" && (
              <>
                <CheckCircle2 className="w-12 h-12 text-gold mb-5" />
                <span className="font-body text-[11px] tracking-[0.3em] uppercase text-gold">Clube La Régence</span>
                <h1 className="font-display text-3xl lg:text-4xl text-brown-dark mt-2 mb-4">Assinatura confirmada</h1>
                <p className="font-body text-sm text-muted-foreground leading-relaxed mb-8">
                  Seu pagamento caiu certinho. Enviamos a confirmação para{" "}
                  <strong className="text-brown-dark">{status.email}</strong>.
                </p>
              </>
            )}

            {status.state === "processing" && (
              <>
                <Clock className="w-12 h-12 text-gold mb-5" />
                <h1 className="font-display text-3xl text-brown-dark mb-4">Pagamento recebido</h1>
                <p className="font-body text-sm text-muted-foreground leading-relaxed mb-8">
                  Estamos finalizando a ativação da sua assinatura. Isso leva alguns segundos — esta página
                  atualiza sozinha e a confirmação chega por e-mail.
                </p>
              </>
            )}

            {status.state === "pending" && (
              <>
                <Clock className="w-12 h-12 text-brown-light mb-5" />
                <h1 className="font-display text-3xl text-brown-dark mb-4">Aguardando o pagamento</h1>
                <p className="font-body text-sm text-muted-foreground leading-relaxed mb-8">
                  Ainda não recebemos a confirmação do pagamento. Assim que o banco confirmar, ativamos sua
                  assinatura e avisamos por e-mail.
                </p>
              </>
            )}

            {status.state === "failed" && (
              <>
                <AlertCircle className="w-12 h-12 text-destructive mb-5" />
                <h1 className="font-display text-3xl text-brown-dark mb-4">O pagamento não foi concluído</h1>
                <p className="font-body text-sm text-muted-foreground leading-relaxed mb-8">
                  Nada foi cobrado. Você pode tentar de novo — leva menos de um minuto.
                </p>
                <Button asChild className="rounded-full bg-gold text-white hover:bg-gold-dark font-body text-xs tracking-[0.2em] uppercase px-8">
                  <Link to="/assinatura">Tentar novamente</Link>
                </Button>
              </>
            )}

            {status.plano && status.state !== "failed" && (
              <dl className="border-t border-cream-500 pt-6 space-y-3 font-body text-sm">
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Plano</dt><dd className="text-brown-dark">{status.plano} · {status.valor}/mês</dd></div>
                {status.cafe && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Café</dt><dd className="text-brown-dark">{status.cafe}</dd></div>}
                {status.moagem && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Moagem</dt><dd className="text-brown-dark">{status.moagem}</dd></div>}
                {status.despacharAte && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Despacho até</dt><dd className="text-brown-dark">{status.despacharAte}</dd></div>}
                {enderecoTexto && <div className="flex justify-between gap-4"><dt className="text-muted-foreground shrink-0">Entrega</dt><dd className="text-brown-dark text-right">{enderecoTexto}</dd></div>}
                {status.proximaCobranca && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Próxima cobrança</dt><dd className="text-brown-dark">{status.proximaCobranca}</dd></div>}
              </dl>
            )}

            {status.state !== "failed" && (
              <div className="flex flex-wrap gap-3 mt-8">
                <Button asChild className="rounded-full bg-gold text-white hover:bg-gold-dark font-body text-xs tracking-[0.2em] uppercase px-8">
                  <Link to="/conta?tab=assinatura">Minha assinatura</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full font-body text-xs tracking-[0.2em] uppercase">
                  <Link to="/cafes">Ver cafés</Link>
                </Button>
              </div>
            )}

            <p className="font-body text-xs text-muted-foreground mt-8 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-gold" /> Dúvidas? contato@cafelaregence.com.br
            </p>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default AssinaturaSucessoPage;
