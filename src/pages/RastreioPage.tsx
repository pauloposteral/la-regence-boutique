import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, Search, Truck, CheckCircle2, Clock } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABELS, type StatusPedido } from "@/lib/orderStatus";

interface Resultado {
  pedido: {
    numero: string;
    status: StatusPedido;
    criadoEm: string;
    atualizadoEm: string;
    total: number;
    codigoRastreamento: string | null;
  };
  historico: { status: StatusPedido; em: string }[];
}

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const RastreioPage = () => {
  const [pedido, setPedido] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");
    setResultado(null);
    try {
      const { data, error } = await supabase.functions.invoke("order-track", {
        body: { pedido: pedido.trim(), email: email.trim() },
      });
      if (error) throw new Error("Não encontramos esse pedido. Confira o número e o e-mail.");
      if (data?.error) throw new Error(data.error);
      setResultado(data as Resultado);
    } catch (err: any) {
      setErro(err.message || "Não foi possível consultar agora.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Rastrear Pedido"
        description="Acompanhe o status do seu pedido La Régence com o número do pedido e o e-mail da compra."
      />
      <section className="py-12 lg:py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8 max-w-2xl">
          <p className="font-body text-[11px] tracking-[0.3em] uppercase text-gold mb-3">Acompanhe sua entrega</p>
          <h1 className="font-display text-3xl lg:text-4xl font-semibold text-foreground mb-3">Rastrear Pedido</h1>
          <p className="font-body text-sm text-muted-foreground mb-8">
            Informe o número do pedido e o e-mail usado na compra. Não precisa ter conta.
          </p>

          <form onSubmit={buscar} className="bg-card border border-border rounded-xl p-5 lg:p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="font-body text-xs">Número do pedido</Label>
              <Input
                value={pedido}
                onChange={(e) => setPedido(e.target.value)}
                placeholder="Ex: 1042 ou os 8 primeiros caracteres do código"
                className="rounded-lg font-body text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-xs">E-mail da compra</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="rounded-lg font-body text-sm"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gold text-white hover:bg-gold-dark font-body text-xs tracking-[0.2em] uppercase"
            >
              <Search className="w-3.5 h-3.5 mr-2" />
              {loading ? "Procurando…" : "Rastrear"}
            </Button>
            {erro && <p className="font-body text-xs text-destructive text-center">{erro}</p>}
          </form>

          {resultado && (
            <div className="mt-8 bg-card border border-border rounded-xl p-5 lg:p-6">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
                <div>
                  <p className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Pedido</p>
                  <p className="font-mono text-lg text-gold">{resultado.pedido.numero}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 text-gold-dark px-3 py-1 font-body text-xs">
                  <Truck className="w-3.5 h-3.5" />
                  {STATUS_LABELS[resultado.pedido.status] || resultado.pedido.status}
                </span>
              </div>

              {resultado.pedido.codigoRastreamento && (
                <div className="rounded-lg bg-muted/50 border border-border p-4 mb-5">
                  <p className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                    Código de rastreio
                  </p>
                  <p className="font-mono text-sm text-foreground">{resultado.pedido.codigoRastreamento}</p>
                  <a
                    href={`https://www.linkcorreios.com.br/?id=${encodeURIComponent(resultado.pedido.codigoRastreamento)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-xs text-gold hover:underline mt-2 inline-block"
                  >
                    Acompanhar na transportadora
                  </a>
                </div>
              )}

              <p className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Histórico
              </p>
              <div className="space-y-3 border-l-2 border-gold/20 pl-4 ml-1">
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-gold border-2 border-background" />
                  <p className="font-body text-xs font-medium">Pedido recebido</p>
                  <p className="font-body text-[10px] text-muted-foreground">{dataHora(resultado.pedido.criadoEm)}</p>
                </div>
                {resultado.historico.map((h, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-gold border-2 border-background" />
                    <p className="font-body text-xs font-medium">{STATUS_LABELS[h.status] || h.status}</p>
                    <p className="font-body text-[10px] text-muted-foreground">{dataHora(h.em)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-2 font-body text-xs text-muted-foreground">
                {resultado.pedido.status === "entregue" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Package className="w-3.5 h-3.5 text-gold" />
                )}
                Dúvidas? Fale com a gente pelo{" "}
                <a
                  href="https://wa.me/5518996540883"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:underline"
                >
                  WhatsApp
                </a>
                .
              </div>
            </div>
          )}

          <p className="font-body text-xs text-muted-foreground mt-6">
            Tem conta na loja? Todos os seus pedidos estão na{" "}
            <Link to="/conta" className="text-gold hover:underline">
              área do cliente
            </Link>
            .
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default RastreioPage;
