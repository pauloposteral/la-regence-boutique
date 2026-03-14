import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Check, MapPin, CreditCard, Truck, User, Gift, ShieldCheck, Lock, Package, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkoutSchema } from "@/lib/validation";

const STEPS = [
  { id: "identificacao", label: "Identificação", icon: User },
  { id: "endereco", label: "Endereço", icon: MapPin },
  { id: "envio", label: "Envio", icon: Truck },
  { id: "pagamento", label: "Pagamento", icon: CreditCard },
  { id: "revisao", label: "Revisão", icon: Check },
];

const FRETE_GRATIS_MIN = 150;

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Pagamento Seguro" },
  { icon: Lock, label: "Dados Protegidos" },
  { icon: Package, label: "Entrega Garantida" },
];

const CheckoutPage = () => {
  const { items, subtotal, desconto, cupom, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    nome: "", email: "", telefone: "", cpf: "",
    cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
    frete: "padrao" as "padrao" | "expresso",
    presente: false, mensagemPresente: "",
    metodoPagamento: "card" as "card" | "pix",
  });

  const [cepLoading, setCepLoading] = useState(false);

  const freteGratis = subtotal >= FRETE_GRATIS_MIN;
  const custoFrete = freteGratis ? 0 : form.frete === "expresso" ? 29.90 : 14.90;
  const pixDesconto = form.metodoPagamento === "pix" ? (subtotal - desconto) * 0.1 : 0;
  const total = Math.max(0, subtotal - desconto - pixDesconto + custoFrete);

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const buscarCep = async () => {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) { toast.error("CEP inválido"); return; }
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) { toast.error("CEP não encontrado"); return; }
      setForm((prev) => ({ ...prev, logradouro: data.logradouro || "", bairro: data.bairro || "", cidade: data.localidade || "", estado: data.uf || "" }));
    } catch { toast.error("Erro ao buscar CEP"); }
    finally { setCepLoading(false); }
  };

  const nextStep = () => {
    if (step === 0) {
      const result = checkoutSchema.pick({ nome: true, email: true }).safeParse(form);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((e) => { fieldErrors[e.path[0] as string] = e.message; });
        setErrors(fieldErrors);
        return;
      }
    }
    if (step === 1) {
      const result = checkoutSchema.pick({ cep: true, logradouro: true, numero: true, bairro: true, cidade: true, estado: true }).safeParse(form);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((e) => { fieldErrors[e.path[0] as string] = e.message; });
        setErrors(fieldErrors);
        return;
      }
    }
    setErrors({});
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const prevStep = () => { if (step > 0) setStep(step - 1); };

  const finalizarPedido = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-payment", {
        body: { items, form, subtotal, desconto, custoFrete, total, cupomId: null, metodoPagamento: form.metodoPagamento },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) { window.location.href = data.url; }
      else { throw new Error("URL de pagamento não recebida"); }
    } catch (err: any) {
      toast.error("Erro ao processar pagamento: " + (err.message || "Tente novamente"));
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && step < 4) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
            <Package className="w-8 h-8 text-gold" />
          </div>
          <p className="font-display text-2xl mb-2">Seu carrinho está vazio</p>
          <p className="font-body text-sm text-muted-foreground mb-6">Explore nossos cafés especiais e encontre o seu favorito</p>
          <Button asChild className="bg-gold text-primary-foreground hover:bg-gold-dark rounded-none uppercase tracking-wider font-body text-xs">
            <Link to="/cafes">Explorar Cafés</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const progressPercent = (step / (STEPS.length - 1)) * 100;

  return (
    <Layout>
      <div className="container mx-auto px-4 lg:px-8 py-6 max-w-5xl">
        {/* Header with progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-display text-2xl font-semibold">Checkout</h1>
            <span className="font-mono text-xs text-muted-foreground">
              {step + 1} de {STEPS.length}
            </span>
          </div>
          
          {/* Continuous progress bar */}
          <div className="h-1 bg-border rounded-full overflow-hidden mb-6">
            <motion.div 
              className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === step;
              const done = i < step;
              return (
                <button
                  key={s.id}
                  onClick={() => { if (done) setStep(i); }}
                  disabled={!done}
                  className={`flex flex-col items-center gap-1.5 transition-all ${done ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      done
                        ? "bg-gold text-primary-foreground shadow-[0_0_12px_hsl(var(--gold)/0.3)]"
                        : active
                        ? "bg-gold/15 text-gold ring-2 ring-gold/40"
                        : "bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-body hidden sm:block ${active ? "text-gold font-semibold" : done ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 mb-8 py-3 border-y border-border/50">
          {TRUST_BADGES.map((b) => (
            <div key={b.label} className="flex items-center gap-1.5 text-muted-foreground">
              <b.icon className="w-3.5 h-3.5 text-gold" />
              <span className="font-body text-[10px] font-medium tracking-wide uppercase">{b.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main form area */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="bg-card border border-border rounded-lg p-6 lg:p-8"
              >
                {/* Step 0: Identificação */}
                {step === 0 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-display text-xl font-semibold">Identificação</h2>
                      <p className="font-body text-xs text-muted-foreground mt-1">Informe seus dados para o pedido</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-body text-xs text-muted-foreground">Nome completo *</Label>
                        <Input value={form.nome} onChange={(e) => updateField("nome", e.target.value)} className={`font-body mt-1 ${errors.nome ? "border-destructive" : ""}`} />
                        {errors.nome && <p className="text-[10px] text-destructive mt-1">{errors.nome}</p>}
                      </div>
                      <div>
                        <Label className="font-body text-xs text-muted-foreground">E-mail *</Label>
                        <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className={`font-body mt-1 ${errors.email ? "border-destructive" : ""}`} />
                        {errors.email && <p className="text-[10px] text-destructive mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <Label className="font-body text-xs text-muted-foreground">Telefone</Label>
                        <Input value={form.telefone} onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "").slice(0, 11);
                          if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
                          else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
                          else if (v.length > 0) v = `(${v}`;
                          updateField("telefone", v);
                        }} className="font-body mt-1" placeholder="(00) 00000-0000" />
                      </div>
                      <div>
                        <Label className="font-body text-xs text-muted-foreground">CPF</Label>
                        <Input value={form.cpf} onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "").slice(0, 11);
                          if (v.length > 9) v = `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6,9)}-${v.slice(9)}`;
                          else if (v.length > 6) v = `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6)}`;
                          else if (v.length > 3) v = `${v.slice(0,3)}.${v.slice(3)}`;
                          updateField("cpf", v);
                        }} className="font-body mt-1" placeholder="000.000.000-00" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1: Endereço */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-display text-xl font-semibold">Endereço de Entrega</h2>
                      <p className="font-body text-xs text-muted-foreground mt-1">Para onde devemos enviar seu pedido?</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="font-body text-xs text-muted-foreground">CEP *</Label>
                        <Input value={form.cep} onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "").slice(0, 8);
                          if (v.length > 5) v = `${v.slice(0,5)}-${v.slice(5)}`;
                          updateField("cep", v);
                        }} placeholder="00000-000" className={`font-body mt-1 ${errors.cep ? "border-destructive" : ""}`} />
                        {errors.cep && <p className="text-[10px] text-destructive mt-1">{errors.cep}</p>}
                      </div>
                      <Button variant="outline" className="self-end font-body text-xs h-10 border-gold/30 text-gold hover:bg-gold/10" onClick={buscarCep} disabled={cepLoading}>
                        {cepLoading ? "..." : "Buscar CEP"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <Label className="font-body text-xs text-muted-foreground">Logradouro *</Label>
                        <Input value={form.logradouro} onChange={(e) => updateField("logradouro", e.target.value)} className={`font-body mt-1 ${errors.logradouro ? "border-destructive" : ""}`} />
                      </div>
                      <div>
                        <Label className="font-body text-xs text-muted-foreground">Número *</Label>
                        <Input value={form.numero} onChange={(e) => updateField("numero", e.target.value)} className={`font-body mt-1 ${errors.numero ? "border-destructive" : ""}`} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><Label className="font-body text-xs text-muted-foreground">Complemento</Label><Input value={form.complemento} onChange={(e) => updateField("complemento", e.target.value)} className="font-body mt-1" /></div>
                      <div><Label className="font-body text-xs text-muted-foreground">Bairro *</Label><Input value={form.bairro} onChange={(e) => updateField("bairro", e.target.value)} className={`font-body mt-1 ${errors.bairro ? "border-destructive" : ""}`} /></div>
                      <div><Label className="font-body text-xs text-muted-foreground">Cidade *</Label><Input value={form.cidade} onChange={(e) => updateField("cidade", e.target.value)} className={`font-body mt-1 ${errors.cidade ? "border-destructive" : ""}`} /></div>
                      <div><Label className="font-body text-xs text-muted-foreground">Estado *</Label><Input value={form.estado} onChange={(e) => updateField("estado", e.target.value)} className={`font-body mt-1 ${errors.estado ? "border-destructive" : ""}`} maxLength={2} /></div>
                    </div>
                  </div>
                )}

                {/* Step 2: Envio */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-display text-xl font-semibold">Método de Envio</h2>
                      <p className="font-body text-xs text-muted-foreground mt-1">Escolha como deseja receber</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { value: "padrao", label: "Padrão", desc: "5 a 10 dias úteis", price: freteGratis ? "Grátis" : "R$ 14,90", icon: "📦" },
                        { value: "expresso", label: "Expresso", desc: "2 a 4 dias úteis", price: freteGratis ? "Grátis" : "R$ 29,90", icon: "⚡" },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                            form.frete === opt.value
                              ? "border-gold bg-gold/5 shadow-[0_0_16px_hsl(var(--gold)/0.08)]"
                              : "border-border hover:border-gold/30"
                          }`}
                          onClick={() => updateField("frete", opt.value)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              form.frete === opt.value ? "border-gold" : "border-muted-foreground/40"
                            }`}>
                              {form.frete === opt.value && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 rounded-full bg-gold" />
                              )}
                            </div>
                            <div>
                              <p className="font-body font-medium text-sm flex items-center gap-2">
                                <span>{opt.icon}</span> {opt.label}
                              </p>
                              <p className="text-xs text-muted-foreground font-body">{opt.desc}</p>
                            </div>
                          </div>
                          <span className={`font-mono text-sm font-semibold ${custoFrete === 0 ? "text-gold" : ""}`}>{opt.price}</span>
                        </label>
                      ))}
                    </div>

                    {freteGratis && (
                      <div className="bg-gold/10 rounded-lg p-3 text-center">
                        <p className="font-body text-xs text-gold font-medium">🎉 Frete grátis para compras acima de R$ {FRETE_GRATIS_MIN},00!</p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Checkbox checked={form.presente} onCheckedChange={(v) => updateField("presente", !!v)} id="presente" />
                        <Label htmlFor="presente" className="font-body text-sm flex items-center gap-1.5 cursor-pointer">
                          <Gift className="w-4 h-4 text-gold" /> É um presente
                        </Label>
                      </div>
                      {form.presente && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}>
                          <Input placeholder="Mensagem personalizada (opcional)" value={form.mensagemPresente} onChange={(e) => updateField("mensagemPresente", e.target.value)} className="font-body text-sm" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Pagamento */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-display text-xl font-semibold">Método de Pagamento</h2>
                      <p className="font-body text-xs text-muted-foreground mt-1">Selecione como deseja pagar</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { value: "card", label: "Cartão de Crédito", desc: "Parcelamento em até 3x sem juros", icon: "💳" },
                        { value: "pix", label: "Pix (desconto no cartão)", desc: "10% de desconto aplicado ao pagamento", icon: "⚡", badge: "-10%" },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                            form.metodoPagamento === opt.value
                              ? "border-gold bg-gold/5 shadow-[0_0_16px_hsl(var(--gold)/0.08)]"
                              : "border-border hover:border-gold/30"
                          }`}
                          onClick={() => updateField("metodoPagamento", opt.value)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              form.metodoPagamento === opt.value ? "border-gold" : "border-muted-foreground/40"
                            }`}>
                              {form.metodoPagamento === opt.value && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 rounded-full bg-gold" />
                              )}
                            </div>
                            <div>
                              <p className="font-body font-medium text-sm flex items-center gap-2">
                                <span>{opt.icon}</span> {opt.label}
                              </p>
                              <p className="text-xs text-muted-foreground font-body">{opt.desc}</p>
                            </div>
                          </div>
                          {opt.badge && form.metodoPagamento === opt.value && (
                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[10px] font-mono font-bold bg-gold text-primary-foreground px-2 py-0.5 rounded-full">
                              {opt.badge}
                            </motion.span>
                          )}
                        </label>
                      ))}
                    </div>

                    <AnimatePresence>
                      {form.metodoPagamento === "pix" && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="bg-gold/10 border border-gold/20 rounded-lg p-4 text-center">
                            <p className="font-body text-sm text-gold font-semibold">💰 Desconto Pix: -R$ {pixDesconto.toFixed(2).replace(".", ",")}</p>
                            <p className="font-mono text-xs text-muted-foreground mt-1">Novo total: R$ {total.toFixed(2).replace(".", ",")}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <p className="font-body text-[10px] text-muted-foreground text-center pt-2">
                      Pagamento processado com segurança via Stripe 🔒
                    </p>
                  </div>
                )}

                {/* Step 4: Revisão */}
                {step === 4 && (
                  <div className="space-y-5">
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-3">
                        <Check className="w-6 h-6 text-gold" />
                      </div>
                      <h2 className="font-display text-xl font-semibold">Revisar Pedido</h2>
                      <p className="font-body text-xs text-muted-foreground mt-1">Confira os dados antes de finalizar</p>
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: "Cliente", value: `${form.nome} · ${form.email}`, step: 0 },
                        { label: "Endereço", value: `${form.logradouro}, ${form.numero} — ${form.bairro}, ${form.cidade}/${form.estado}`, step: 1 },
                        { label: "Envio", value: form.frete === "expresso" ? "Expresso (2-4 dias)" : "Padrão (5-10 dias)", step: 2 },
                        { label: "Pagamento", value: form.metodoPagamento === "pix" ? "Pix (10% desconto)" : "Cartão de Crédito", step: 3 },
                      ].map((item) => (
                        <div key={item.label} className="flex items-start justify-between p-3 bg-muted/20 rounded-lg border border-border/50">
                          <div>
                            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                            <p className="font-body text-sm mt-0.5">{item.value}</p>
                          </div>
                          <button
                            onClick={() => setStep(item.step)}
                            className="font-body text-[10px] text-gold hover:underline underline-offset-2 shrink-0 mt-1"
                          >
                            Editar
                          </button>
                        </div>
                      ))}
                      {form.presente && (
                        <div className="p-3 bg-gold/5 rounded-lg border border-gold/20">
                          <p className="font-body text-[10px] text-gold uppercase tracking-wider flex items-center gap-1"><Gift className="w-3 h-3" /> Presente</p>
                          <p className="font-body text-sm mt-0.5">{form.mensagemPresente || "Sem mensagem"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-5 border-t border-border">
                  {step > 0 ? (
                    <Button variant="ghost" onClick={prevStep} className="font-body text-xs text-muted-foreground hover:text-foreground">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                    </Button>
                  ) : (
                    <Button variant="ghost" asChild className="font-body text-xs text-muted-foreground hover:text-foreground">
                      <Link to="/cafes"><ChevronLeft className="w-4 h-4 mr-1" /> Continuar Comprando</Link>
                    </Button>
                  )}
                  {step < 4 ? (
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button onClick={nextStep} className="font-body text-xs bg-gold text-primary-foreground hover:bg-gold-dark rounded-none uppercase tracking-[0.15em] px-8 h-11">
                        Continuar <ArrowRight className="w-3.5 h-3.5 ml-2" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button
                        onClick={finalizarPedido}
                        disabled={submitting}
                        className="font-body text-xs bg-gold text-primary-foreground hover:bg-gold-dark rounded-none uppercase tracking-[0.15em] px-8 h-11 shadow-[0_0_20px_hsl(var(--gold)/0.2)]"
                      >
                        {submitting ? (
                          <span className="flex items-center gap-2"><span className="btn-spinner" /> Processando…</span>
                        ) : (
                          <>Confirmar e Pagar <Lock className="w-3 h-3 ml-2" /></>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Order summary sidebar — sticky */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg overflow-hidden sticky top-24">
              <div className="h-1 bg-gradient-to-r from-gold-dark via-gold to-gold-light" />
              <div className="p-5 space-y-4">
                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                  Resumo
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items.length} {items.length === 1 ? "item" : "itens"}</span>
                </h3>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={`${item.produtoId}-${item.varianteId}`} className="flex gap-3">
                      <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center shrink-0 overflow-hidden">
                        {item.imagemUrl ? <img src={item.imagemUrl} alt="" className="w-full h-full object-cover" loading="lazy" /> : <span className="text-lg">☕</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-xs font-medium truncate">{item.nome}</p>
                        <p className="text-[10px] text-muted-foreground font-body">Qtd: {item.quantidade}</p>
                      </div>
                      <span className="font-mono text-xs font-semibold shrink-0 text-gold">
                        R$ {((item.precoPromocional || item.preco) * item.quantidade).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-3 space-y-2 text-sm font-body">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-mono">R$ {subtotal.toFixed(2).replace(".", ",")}</span>
                  </div>
                  {desconto > 0 && (
                    <div className="flex justify-between text-gold">
                      <span>Cupom ({cupom})</span>
                      <span className="font-mono">-R$ {desconto.toFixed(2).replace(".", ",")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Frete</span>
                    <span className={`font-mono ${custoFrete === 0 ? "text-gold" : ""}`}>
                      {custoFrete === 0 ? "Grátis" : `R$ ${custoFrete.toFixed(2).replace(".", ",")}`}
                    </span>
                  </div>
                  {pixDesconto > 0 && (
                    <div className="flex justify-between text-gold">
                      <span>Desconto Pix</span>
                      <span className="font-mono">-R$ {pixDesconto.toFixed(2).replace(".", ",")}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-base pt-3 border-t border-border">
                    <span>Total</span>
                    <span className="font-mono text-gold">R$ {total.toFixed(2).replace(".", ",")}</span>
                  </div>
                </div>

                {/* Security footer */}
                <div className="pt-3 border-t border-border/50 flex items-center justify-center gap-4">
                  {TRUST_BADGES.slice(0, 2).map((b) => (
                    <div key={b.label} className="flex items-center gap-1 text-muted-foreground/60">
                      <b.icon className="w-3 h-3" />
                      <span className="text-[9px] font-body">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
