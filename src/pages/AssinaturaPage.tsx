import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Coffee, Gift, Truck, Star, ArrowRight, Pause, X as XIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type TipoAssinatura = Database["public"]["Enums"]["tipo_assinatura"];
type TipoMoagem = Database["public"]["Enums"]["tipo_moagem"];

const PLANS: {
  tipo: TipoAssinatura;
  label: string;
  price: number;
  originalPrice: number;
  discount: string;
  period: string;
  badge?: string;
}[] = [
  { tipo: "mensal", label: "Mensal", price: 49.9, originalPrice: 49.9, discount: "", period: "/mês" },
  { tipo: "trimestral", label: "Trimestral", price: 44.9, originalPrice: 49.9, discount: "10% off", period: "/mês", badge: "Mais popular" },
  { tipo: "semestral", label: "Semestral", price: 39.9, originalPrice: 49.9, discount: "20% off", period: "/mês", badge: "Melhor custo" },
];

const MOAGEM_LABELS: Record<TipoMoagem, string> = {
  graos: "Grãos inteiros",
  grossa: "Grossa (French Press)",
  media: "Média (Coador/V60)",
  fina: "Fina (Espresso)",
  extra_fina: "Extra fina (Turco)",
};

const BENEFITS = [
  { icon: Coffee, title: "Cafés exclusivos", desc: "Seleção especial da nossa equipe de torrefação" },
  { icon: Truck, title: "Frete grátis", desc: "Em todas as entregas da assinatura" },
  { icon: Gift, title: "Brindes surpresa", desc: "Receba acessórios e amostras exclusivas" },
  { icon: Star, title: "Desconto em loja", desc: "10% off em todos os produtos da loja" },
];

const AssinaturaPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedPlan, setSelectedPlan] = useState<TipoAssinatura>("trimestral");
  const [cafeSurpresa, setCafeSurpresa] = useState(true);
  const [moagem, setMoagem] = useState<TipoMoagem>("media");

  // Load user's active subscription
  const { data: assinatura } = useQuery({
    queryKey: ["assinatura", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("assinaturas")
        .select("*, produtos(nome, slug)")
        .eq("user_id", user!.id)
        .eq("status", "ativa")
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Load available coffees for fixed selection
  const { data: cafes = [] } = useQuery({
    queryKey: ["cafes-assinatura"],
    queryFn: async () => {
      const { data } = await supabase
        .from("produtos")
        .select("id, nome, slug, preco, notas_sensoriais, produto_imagens(url, principal)")
        .eq("ativo", true)
        .order("destaque", { ascending: false })
        .limit(6);
      return data || [];
    },
  });

  const [selectedCafe, setSelectedCafe] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!user) {
      toast.info("Faça login para assinar");
      navigate("/auth");
      return;
    }

    const plan = PLANS.find((p) => p.tipo === selectedPlan)!;
    const { error } = await supabase.from("assinaturas").insert({
      user_id: user.id,
      tipo: selectedPlan,
      preco: plan.price,
      moagem,
      cafe_surpresa: cafeSurpresa,
      produto_id: cafeSurpresa ? null : selectedCafe,
      proxima_entrega: new Date(Date.now() + 7 * 86400000).toISOString(),
    });

    if (error) {
      toast.error("Erro ao criar assinatura");
    } else {
      toast.success("Assinatura criada com sucesso! ☕");
      queryClient.invalidateQueries({ queryKey: ["assinatura"] });
    }
  };

  const handlePause = async () => {
    if (!assinatura) return;
    await supabase.from("assinaturas").update({ status: "pausada" }).eq("id", assinatura.id);
    toast.success("Assinatura pausada");
    queryClient.invalidateQueries({ queryKey: ["assinatura"] });
  };

  const handleCancel = async () => {
    if (!assinatura) return;
    await supabase.from("assinaturas").update({ status: "cancelada" }).eq("id", assinatura.id);
    toast.success("Assinatura cancelada");
    queryClient.invalidateQueries({ queryKey: ["assinatura"] });
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-background border-b border-border py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border border-gold/10" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full border border-gold/5" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-gold text-xs font-body tracking-[0.3em] uppercase">Clube La Régence</span>
            <h1 className="font-display text-4xl lg:text-6xl font-light mt-3 mb-6 text-foreground">
              Café especial em sua{" "}
              <span className="italic font-medium text-gradient-gold">porta</span>
            </h1>
            <p className="text-muted-foreground font-body leading-relaxed max-w-xl mx-auto mb-8">
              Receba mensalmente cafés selecionados pela nossa equipe de especialistas, com torrefação
              artesanal e entrega no conforto da sua casa.
            </p>
            <Button
              size="lg"
              className="bg-gold text-white hover:bg-gold-dark font-body text-sm tracking-wider uppercase px-8 transition-all duration-300"
              onClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })}
            >
              Conhecer Planos <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gold/10 flex items-center justify-center">
                  <b.icon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="font-display text-sm font-semibold mb-1">{b.title}</h3>
                <p className="font-body text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans or Management */}
      <section id="planos" className="py-16 lg:py-20 bg-secondary/30">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          {assinatura ? (
            /* Subscription Management */
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="font-display text-2xl lg:text-3xl text-center mb-8">Sua Assinatura</h2>
              <div className="bg-card border border-border rounded-lg p-6 lg:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Plano</p>
                    <p className="font-display text-xl font-semibold capitalize">{assinatura.tipo}</p>
                  </div>
                  <Badge className="bg-gold/15 text-gold font-body text-xs border border-gold/30">Ativa</Badge>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="font-body text-xs text-muted-foreground">Moagem</p>
                    <p className="font-body text-sm font-medium">{MOAGEM_LABELS[assinatura.moagem as TipoMoagem] || "—"}</p>
                  </div>
                  <div>
                    <p className="font-body text-xs text-muted-foreground">Tipo</p>
                    <p className="font-body text-sm font-medium">{assinatura.cafe_surpresa ? "Café surpresa" : "Café fixo"}</p>
                  </div>
                  <div>
                    <p className="font-body text-xs text-muted-foreground">Próxima entrega</p>
                    <p className="font-body text-sm font-medium">
                      {assinatura.proxima_entrega
                        ? new Date(assinatura.proxima_entrega).toLocaleDateString("pt-BR")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-body text-xs text-muted-foreground">Valor</p>
                    <p className="font-body text-sm font-semibold">
                      R$ {Number(assinatura.preco).toFixed(2).replace(".", ",")}/mês
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" className="font-body text-xs gap-1.5" onClick={handlePause}>
                    <Pause className="w-3.5 h-3.5" /> Pausar
                  </Button>
                  <Button variant="outline" size="sm" className="font-body text-xs gap-1.5 text-destructive hover:text-destructive" onClick={handleCancel}>
                    <XIcon className="w-3.5 h-3.5" /> Cancelar
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Plan Selection */
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="font-display text-2xl lg:text-3xl text-center mb-2">Escolha seu plano</h2>
              <p className="font-body text-sm text-muted-foreground text-center mb-10">
                Cancele quando quiser. Sem fidelidade.
              </p>

              {/* Plan Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                {PLANS.map((plan) => {
                  const active = selectedPlan === plan.tipo;
                  return (
                    <button
                      key={plan.tipo}
                      onClick={() => setSelectedPlan(plan.tipo)}
                      className={`relative text-left rounded-xl border-2 p-5 transition-all ${
                        active ? "border-gold bg-gold/5 shadow-[0_4px_20px_-8px_hsl(var(--gold)/0.3)]" : "border-cream-400 bg-cream-50 hover:border-gold/40"
                      }`}
                    >
                      {plan.badge && (
                        <Badge className="absolute -top-2.5 left-4 bg-gold text-white font-body text-[10px] shadow-sm rounded-full">
                          {plan.badge}
                        </Badge>
                      )}
                      <p className="font-display text-lg font-semibold mb-1">{plan.label}</p>
                      <div className="flex items-baseline gap-1.5 mb-2">
                        <span className="font-display text-2xl font-bold">
                          R$ {plan.price.toFixed(2).replace(".", ",")}
                        </span>
                        <span className="font-body text-xs text-muted-foreground">{plan.period}</span>
                      </div>
                      {plan.discount && (
                        <p className="font-body text-xs text-gold font-medium">
                          {plan.discount} — era R$ {plan.originalPrice.toFixed(2).replace(".", ",")}
                        </p>
                      )}
                      <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        active ? "border-gold bg-gold" : "border-border"
                      }`}>
                        {active && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Preferences */}
              <div className="bg-cream-50 border border-cream-400 rounded-xl p-6 space-y-6 mb-8">
                <h3 className="font-display text-lg font-semibold">Personalize sua experiência</h3>

                {/* Coffee type */}
                <div>
                  <p className="font-body text-sm font-medium mb-3">Tipo de café</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setCafeSurpresa(true)}
                      className={`rounded-lg border-2 p-4 text-left transition-all ${
                        cafeSurpresa ? "border-gold bg-gold/5" : "border-border hover:border-gold/40"
                      }`}
                    >
                      <Gift className="w-5 h-5 text-gold mb-2" />
                      <p className="font-body text-sm font-medium">Café surpresa</p>
                      <p className="font-body text-xs text-muted-foreground">Curadoria La Régence todo mês</p>
                    </button>
                    <button
                      onClick={() => setCafeSurpresa(false)}
                      className={`rounded-lg border-2 p-4 text-left transition-all ${
                        !cafeSurpresa ? "border-gold bg-gold/5" : "border-border hover:border-gold/40"
                      }`}
                    >
                      <Coffee className="w-5 h-5 text-gold mb-2" />
                      <p className="font-body text-sm font-medium">Café fixo</p>
                      <p className="font-body text-xs text-muted-foreground">Escolha seu favorito</p>
                    </button>
                  </div>
                </div>

                {/* Fixed coffee selection */}
                {!cafeSurpresa && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <p className="font-body text-sm font-medium mb-3">Escolha o café</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {cafes.map((cafe: any) => {
                        const img = cafe.produto_imagens?.find((i: any) => i.principal)?.url || cafe.produto_imagens?.[0]?.url;
                        const active = selectedCafe === cafe.id;
                        return (
                          <button
                            key={cafe.id}
                            onClick={() => setSelectedCafe(cafe.id)}
                            className={`rounded-lg border-2 p-3 text-left transition-all flex gap-3 items-center ${
                              active ? "border-gold bg-gold/5" : "border-border hover:border-gold/40"
                            }`}
                          >
                            <div className="w-12 h-12 rounded bg-secondary flex-shrink-0 overflow-hidden">
                              {img ? <img src={img} alt={cafe.nome} className="w-full h-full object-cover" /> : <span className="flex w-full h-full items-center justify-center text-xl">☕</span>}
                            </div>
                            <div className="min-w-0">
                              <p className="font-body text-xs font-medium truncate">{cafe.nome}</p>
                              <p className="font-body text-[10px] text-muted-foreground truncate">
                                {(cafe.notas_sensoriais || []).slice(0, 2).join(", ")}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Grind */}
                <div>
                  <p className="font-body text-sm font-medium mb-3">Moagem preferida</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(MOAGEM_LABELS) as [TipoMoagem, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setMoagem(key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-body transition-all border ${
                          moagem === key
                            ? "border-gold bg-gold/10 text-gold font-medium"
                            : "border-border text-muted-foreground hover:border-gold/40"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <Button
                  size="lg"
                  className="bg-gold text-primary-foreground hover:bg-gold-light font-body text-sm tracking-wider uppercase px-10 rounded-none transition-all duration-300"
                  onClick={handleSubscribe}
                  disabled={!cafeSurpresa && !selectedCafe}
                >
                  Assinar agora — R$ {PLANS.find((p) => p.tipo === selectedPlan)!.price.toFixed(2).replace(".", ",")}/mês
                </Button>
                <p className="font-body text-xs text-muted-foreground mt-3">
                  Cancele quando quiser · Primeira entrega em até 7 dias
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <h2 className="font-display text-2xl lg:text-3xl text-center mb-10">Como funciona</h2>
          <div className="space-y-8">
            {[
              { step: "01", title: "Escolha seu plano", desc: "Selecione a frequência e o tipo de café que deseja receber." },
              { step: "02", title: "Personalize", desc: "Defina a moagem, método de preparo e se prefere café surpresa ou fixo." },
              { step: "03", title: "Receba em casa", desc: "Seu café é torrado sob demanda e enviado com frete grátis todo mês." },
              { step: "04", title: "Gerencie facilmente", desc: "Pause, troque o café ou cancele quando quiser, sem burocracia." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-5"
              >
                <span className="font-display text-3xl font-bold text-gold/20 shrink-0">{item.step}</span>
                <div>
                  <h3 className="font-display text-base font-semibold mb-1">{item.title}</h3>
                  <p className="font-body text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AssinaturaPage;
