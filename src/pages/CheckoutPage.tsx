import { formatBRL, moneyValue } from "@/lib/money";
import { useState, useEffect } from "react";
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
import { trackBeginCheckout } from "@/lib/analytics";
import { amountCents, checkoutTotals } from "../../supabase/functions/_shared/checkoutAmounts";

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
  const { items, subtotal, desconto, cupom, cupomTipo, setDesconto, setCupom, setCupomTipo, clearCart, validatePricesNow } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    nome: "", email: "", telefone: "", cpf: "",
    cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
    frete: "" as string, // serviço selecionado (id do Melhor Envio)
    freteNome: "", freteCompany: "", fretePreco: 0, fretePrazo: "" as string,
    presente: false, mensagemPresente: "",
    metodoPagamento: "card" as "card" | "pix",
  });

  const [cepLoading, setCepLoading] = useState(false);
  const [freteOpts, setFreteOpts] = useState<FreteOption[]>([]);
  const [freteLoading, setFreteLoading] = useState(false);
  const [freteErr, setFreteErr] = useState("");
  const [freteGratisFlag, setFreteGratisFlag] = useState(false);
  // Inputs that the shipping quote depends on; a quote is valid only for the exact key it was computed with.
  const freteQuoteKey = JSON.stringify([
    form.cep.replace(/\D/g, ""), form.estado, cupom || "", form.metodoPagamento, subtotal,
    items.map((i) => [i.produtoId, i.varianteId || null, i.quantidade]),
  ]);
  const [freteQuotedKey, setFreteQuotedKey] = useState<string | null>(null);
  const freteQuoteFresh = !freteLoading && freteQuotedKey === freteQuoteKey;

  const freteZeradoPorCupom = cupomTipo === "frete_gratis";
  const custoFrete = freteZeradoPorCupom ? 0 : form.fretePreco;
  const amountsValid = Number.isFinite(subtotal) && Number.isFinite(desconto) && Number.isFinite(custoFrete);
  const totals = amountsValid && subtotal >= 0 && desconto >= 0 && desconto <= subtotal && custoFrete >= 0
    ? checkoutTotals(subtotal, desconto, custoFrete, form.metodoPagamento === "pix") : null;
  const pixDesconto = totals?.pixDiscount ?? NaN;
  const total = totals?.total ?? NaN;

  const updateField = (field: string, value: string | number | boolean) => {
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
    if (step >= 2 && !freteQuoteFresh) {
      toast.error(freteLoading ? "Aguarde o cálculo do frete" : "Recalcule o frete antes de continuar");
      return;
    }
    if (step === 2 && !form.frete) {
      toast.error("Selecione uma opção de envio");
      return;
    }
    setErrors({});
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const prevStep = () => { if (step > 0) setStep(step - 1); };

  // Fetch Melhor Envio quotes from step 2 on; re-quote whenever address, items, coupon or payment method change
  useEffect(() => {
    if (step < 2) return;
    const cepDigits = form.cep.replace(/\D/g, "");
    if (cepDigits.length !== 8 || items.length === 0) return;

    let cancelled = false;
    const quoteKey = freteQuoteKey;
    setFreteLoading(true);
    setFreteErr("");
    setFreteQuotedKey(null);

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("calcular-frete", {
          body: {
            cep_destino: cepDigits,
            estado: form.estado,
            subtotal,
            cupom_codigo: cupom || null,
            metodo_pagamento: form.metodoPagamento,
            items: items.map((i) => ({
              produtoId: i.produtoId,
              varianteId: i.varianteId || null,
              quantidade: i.quantidade,
            })),
          },
        });
        if (cancelled) return;
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        const opts = ((data?.options || []) as FreteOption[]).map((opt) => {
          const price = moneyValue(opt.price);
          if (price < 0 || (opt.free && price !== 0)) throw new Error("Frete inválido");
          return { ...opt, price };
        });
        // The quote already previews the coupon against SERVER prices without consuming it.
        // Refresh the shared cart discount before marking this quote ready for payment.
        if (cupom) {
          const coupon = data?.coupon;
          if (!coupon || typeof coupon.valid !== "boolean") throw new Error("Cupom não validado na cotação");
          if (coupon.valid) {
            const discount = moneyValue(coupon.desconto);
            if (discount < 0 || discount > subtotal || !["desconto", "frete_gratis"].includes(coupon.tipo)) {
              throw new Error("Desconto inválido na cotação");
            }
            setDesconto(coupon.tipo === "frete_gratis" ? 0 : discount);
            setCupomTipo(coupon.tipo);
          } else {
            setCupom(null);
            setDesconto(0);
            setCupomTipo(null);
            toast.error("O cupom não é mais válido para este carrinho e foi removido.");
            // Removing the code triggers a new quote with the current inputs.
            return;
          }
        }
        setFreteOpts(opts);
        setFreteGratisFlag(!!data?.free_shipping);
        // Keep the chosen service if it is still offered (with its NEW price); otherwise pick the cheapest.
        setForm((prev) => {
          const chosen = (prev.frete && opts.find((o) => String(o.id) === String(prev.frete))) || opts[0];
          if (!chosen) return { ...prev, frete: "", freteNome: "", freteCompany: "", fretePreco: 0, fretePrazo: "" };
          return { ...prev, ...freteSelection(chosen) };
        });
        setFreteQuotedKey(quoteKey);
      } catch (e: unknown) {
        if (cancelled) return;
        console.error(e);
        setFreteErr("Não foi possível calcular o frete. Verifique o CEP e tente novamente.");
      } finally {
        if (!cancelled) setFreteLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, freteQuoteKey, subtotal]);

  const finalizarPedido = async () => {
    if (!amountsValid) { toast.error("Valores inválidos. Revise o carrinho antes de pagar."); return; }
    if (submitting) return; // Prevent double-submit
    if (!freteQuoteFresh || !form.frete) { toast.error("Aguarde o frete atualizado antes de pagar."); return; }
    setSubmitting(true);
    const idempotencyKey = crypto.randomUUID();
    try {
      // GA4 + Pixel: begin_checkout
      trackBeginCheckout(
        total,
        items.map((i) => ({
          id: i.produtoId,
          name: i.nome,
          price: i.precoPromocional ?? i.preco,
          quantity: i.quantidade,
        }))
      );
      // Force fresh price check immediately before posting — surface any price drift
      const updated = await validatePricesNow();
      if (updated) {
        toast.info("Preços do carrinho foram atualizados. Confira antes de continuar.");
        setSubmitting(false);
        return;
      }
      // Server is the source of truth for prices, coupon discount, shipping and total.
      // We only send the cart items and the coupon CODE — never amounts.
      const { data, error } = await supabase.functions.invoke("create-checkout-payment", {
        body: {
          items,
          form,
          cupomCodigo: cupom || null,
          metodoPagamento: form.metodoPagamento,
          freteServicoId: form.frete,
          idempotencyKey,
          expectedTotal: total, // drift detection only; server computes the charge
        },
      });
      const drift = await readTotalDrift(error);
      if (drift != null) {
        toast.error(`O total confirmado é ${formatBRL(drift)}. Revise valores e frete antes de pagar.`);
        setFreteQuotedKey(null);
        setStep(2);
        return;
      }
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        const validatedTotal = moneyValue(data.validated?.total);
        if (amountCents(validatedTotal) !== amountCents(total)) {
          toast.error(`O total confirmado é ${formatBRL(validatedTotal)}. Revise valores e frete antes de pagar.`);
          return;
        }
        // Save address for logged-in users
        if (user) {
          const { data: existing } = await supabase.from("enderecos").select("id").eq("user_id", user.id).limit(1);
          const isFirst = !existing || existing.length === 0;
          await supabase.from("enderecos").insert({
            user_id: user.id,
            cep: form.cep.replace(/\D/g, ""),
            logradouro: form.logradouro,
            numero: form.numero,
            complemento: form.complemento || null,
            bairro: form.bairro,
            cidade: form.cidade,
            estado: form.estado,
            principal: isFirst,
          });
        }
        window.location.href = data.url;
      } else { throw new Error("URL de pagamento não recebida"); }
    } catch (err: unknown) {
      toast.error("Erro ao processar pagamento: " + ((err instanceof Error && err.message) || "Tente novamente"));
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && step < 4) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
            <Package className="w-8 h-8 text-gold-ink" />
          </div>
          <p className="font-display text-2xl mb-2">Seu carrinho está vazio</p>
          <p className="font-body text-sm text-muted-foreground mb-6">Explore nossos cafés especiais e encontre o seu favorito</p>
          <Button asChild className="bg-gold text-foreground hover:bg-gold-dark rounded-full uppercase tracking-wider font-body text-xs">
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
                  aria-label={s.label} aria-current={active ? "step" : undefined}
                  onClick={() => { if (done) setStep(i); }}
                  disabled={!done}
                  className={`flex flex-col items-center gap-1.5 transition-all ${done ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      done
                        ? "bg-gold text-foreground shadow-[0_0_12px_hsl(var(--gold)/0.3)]"
                        : active
                        ? "bg-gold/15 text-gold-ink ring-2 ring-gold/40"
                        : "bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-body hidden sm:block ${active ? "text-gold-ink font-semibold" : done ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center flex-wrap gap-3 sm:gap-6 mb-8 py-3 border-y border-border/50">
          {TRUST_BADGES.map((b) => (
            <div key={b.label} className="flex items-center gap-1.5 text-muted-foreground">
              <b.icon className="w-3.5 h-3.5 text-gold-ink" />
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
                className="bg-card border border-border rounded-xl p-4 sm:p-6 lg:p-8"
              >
                {/* Step 0: Identificação */}
                {step === 0 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-display text-xl font-semibold">Identificação</h2>
                      <p className="font-body text-xs text-muted-foreground mt-1">Informe seus dados para o pedido</p>
                    </div>
                    {!user && <Button asChild variant="outline" className="w-full"><Link to="/auth?next=%2Fcheckout">Entrar na minha conta</Link></Button>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="checkout-nome" className="font-body text-xs text-muted-foreground">Nome completo *</Label>
                        <Input id="checkout-nome" aria-invalid={!!errors.nome} aria-describedby={errors.nome ? "checkout-nome-error" : undefined} autoComplete="name" value={form.nome} onChange={(e) => updateField("nome", e.target.value)} className={`font-body mt-1 ${errors.nome ? "border-destructive" : ""}`} />
                        {errors.nome && <p id="checkout-nome-error" role="alert" className="text-[10px] text-destructive mt-1">{errors.nome}</p>}
                      </div>
                      <div>
                        <Label htmlFor="checkout-email" className="font-body text-xs text-muted-foreground">E-mail *</Label>
                        <Input id="checkout-email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "checkout-email-error" : undefined} autoComplete="email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className={`font-body mt-1 ${errors.email ? "border-destructive" : ""}`} />
                        {errors.email && <p id="checkout-email-error" role="alert" className="text-[10px] text-destructive mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <Label htmlFor="checkout-telefone" className="font-body text-xs text-muted-foreground">Telefone</Label>
                        <Input id="checkout-telefone" aria-invalid={!!errors.telefone} aria-describedby={errors.telefone ? "checkout-telefone-error" : undefined} autoComplete="tel" value={form.telefone} onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "").slice(0, 11);
                          if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
                          else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
                          else if (v.length > 0) v = `(${v}`;
                          updateField("telefone", v);
                        }} className="font-body mt-1" placeholder="(00) 00000-0000" />
                      </div>
                      <div>
                        <Label htmlFor="checkout-cpf" className="font-body text-xs text-muted-foreground">CPF</Label>
                        <Input id="checkout-cpf" aria-invalid={!!errors.cpf} aria-describedby={errors.cpf ? "checkout-cpf-error" : undefined} value={form.cpf} onChange={(e) => {
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
                        <Label htmlFor="checkout-cep" className="font-body text-xs text-muted-foreground">CEP *</Label>
                        <Input id="checkout-cep" aria-invalid={!!errors.cep} aria-describedby={errors.cep ? "checkout-cep-error" : undefined} autoComplete="postal-code" value={form.cep} onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "").slice(0, 8);
                          if (v.length > 5) v = `${v.slice(0,5)}-${v.slice(5)}`;
                          updateField("cep", v);
                        }} placeholder="00000-000" className={`font-body mt-1 ${errors.cep ? "border-destructive" : ""}`} />
                        {errors.cep && <p id="checkout-cep-error" role="alert" className="text-[10px] text-destructive mt-1">{errors.cep}</p>}
                      </div>
                      <Button variant="outline" className="self-end font-body text-xs h-10 border-gold/30 text-gold-ink hover:bg-gold/10" onClick={buscarCep} disabled={cepLoading}>
                        {cepLoading ? "..." : "Buscar CEP"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <Label htmlFor="checkout-logradouro" className="font-body text-xs text-muted-foreground">Logradouro *</Label>
                        <Input id="checkout-logradouro" aria-invalid={!!errors.logradouro} aria-describedby={errors.logradouro ? "checkout-logradouro-error" : undefined} autoComplete="address-line1" value={form.logradouro} onChange={(e) => updateField("logradouro", e.target.value)} className={`font-body mt-1 ${errors.logradouro ? "border-destructive" : ""}`} />
                      </div>
                      <div>
                        <Label htmlFor="checkout-numero" className="font-body text-xs text-muted-foreground">Número *</Label>
                        <Input id="checkout-numero" aria-invalid={!!errors.numero} aria-describedby={errors.numero ? "checkout-numero-error" : undefined} value={form.numero} onChange={(e) => updateField("numero", e.target.value)} className={`font-body mt-1 ${errors.numero ? "border-destructive" : ""}`} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><Label htmlFor="checkout-complemento" className="font-body text-xs text-muted-foreground">Complemento</Label><Input id="checkout-complemento" aria-invalid={!!errors.complemento} aria-describedby={errors.complemento ? "checkout-complemento-error" : undefined} value={form.complemento} onChange={(e) => updateField("complemento", e.target.value)} className="font-body mt-1" /></div>
                      <div><Label htmlFor="checkout-bairro" className="font-body text-xs text-muted-foreground">Bairro *</Label><Input id="checkout-bairro" aria-invalid={!!errors.bairro} aria-describedby={errors.bairro ? "checkout-bairro-error" : undefined} value={form.bairro} onChange={(e) => updateField("bairro", e.target.value)} className={`font-body mt-1 ${errors.bairro ? "border-destructive" : ""}`} /></div>
                      <div><Label htmlFor="checkout-cidade" className="font-body text-xs text-muted-foreground">Cidade *</Label><Input id="checkout-cidade" aria-invalid={!!errors.cidade} aria-describedby={errors.cidade ? "checkout-cidade-error" : undefined} autoComplete="address-level2" value={form.cidade} onChange={(e) => updateField("cidade", e.target.value)} className={`font-body mt-1 ${errors.cidade ? "border-destructive" : ""}`} /></div>
                      <div><Label htmlFor="checkout-estado" className="font-body text-xs text-muted-foreground">Estado *</Label><Input id="checkout-estado" aria-invalid={!!errors.estado} aria-describedby={errors.estado ? "checkout-estado-error" : undefined} autoComplete="address-level1" value={form.estado} onChange={(e) => updateField("estado", e.target.value)} className={`font-body mt-1 ${errors.estado ? "border-destructive" : ""}`} maxLength={2} /></div>
                    </div>
                  </div>
                )}

                {/* Step 2: Envio */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-display text-xl font-semibold">Método de Envio</h2>
                      <p className="font-body text-xs text-muted-foreground mt-1">Escolha a transportadora e prazo</p>
                    </div>

                    {freteLoading && (
                      <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <div className="btn-spinner mr-3" />
                        <span className="font-body text-sm">Calculando frete...</span>
                      </div>
                    )}

                    {freteErr && !freteLoading && (
                      <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-center">
                        <p className="font-body text-sm text-destructive mb-2">{freteErr}</p>
                        <Button size="sm" variant="outline" onClick={() => setStep(1)} className="font-body text-xs rounded-full">
                          Revisar CEP
                        </Button>
                      </div>
                    )}

                    {!freteLoading && freteOpts.length > 0 && (
                      <div className="space-y-3">
                        {freteOpts.map((opt) => {
                          const selected = form.frete === opt.id;
                          const prazoTxt = opt.delivery_range
                            ? `${opt.delivery_range.min}-${opt.delivery_range.max} dias úteis`
                            : opt.delivery_time
                            ? `até ${opt.delivery_time} dias úteis`
                            : "";
                          return (
                            <label
                              key={opt.id}
                              className={`flex items-center gap-3 justify-between p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                                selected
                                  ? "border-gold bg-gold/5 shadow-[0_0_16px_hsl(var(--gold)/0.08)]"
                                  : "border-border hover:border-gold/30"
                              }`}
                            >
                              <input type="radio" name="shipping" aria-label={`${opt.company} · ${opt.name}`} checked={selected} className="h-5 w-5 shrink-0 accent-gold"
                                onChange={() => {
                                setForm((prev) => ({
                                  ...prev,
                                  frete: opt.id,
                                  freteNome: opt.name,
                                  freteCompany: opt.company,
                                  fretePreco: opt.price,
                                  fretePrazo: prazoTxt,
                                }));
                                }}
                              />

                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="font-body font-medium text-sm">
                                    {opt.company} · {opt.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-body">{prazoTxt}</p>
                                </div>
                              </div>
                              <span className={`font-mono text-sm font-semibold ${opt.free || opt.price === 0 ? "text-gold-ink" : ""}`}>
                                {opt.free || opt.price === 0
                                  ? "Grátis"
                                  : formatBRL(opt.price)}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {freteGratisFlag && (
                      <div className="bg-gold/10 rounded-lg p-3 text-center">
                        <p className="font-body text-xs text-gold-ink font-medium">🎉 Frete grátis aplicado ao seu pedido!</p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Checkbox checked={form.presente} onCheckedChange={(v) => updateField("presente", !!v)} id="presente" />
                        <Label htmlFor="presente" className="font-body text-sm flex items-center gap-1.5 cursor-pointer">
                          <Gift className="w-4 h-4 text-gold-ink" /> É um presente
                        </Label>
                      </div>
                      {form.presente && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}>
                          <Input aria-label="Mensagem do presente" placeholder="Mensagem personalizada (opcional)" value={form.mensagemPresente} onChange={(e) => updateField("mensagemPresente", e.target.value)} className="font-body text-sm" />
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
                        { value: "card", label: "Cartão de Crédito", desc: "Consulte as condições no pagamento", icon: "💳" },
                        { value: "pix", label: "Pix", desc: "10% de desconto aplicado ao pagamento", icon: "⚡", badge: "-10%" },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-3 justify-between p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                            form.metodoPagamento === opt.value
                              ? "border-gold bg-gold/5 shadow-[0_0_16px_hsl(var(--gold)/0.08)]"
                              : "border-border hover:border-gold/30"
                          }`}
                        >
                          <input type="radio" name="payment" aria-label={opt.label} checked={form.metodoPagamento === opt.value} onChange={() => updateField("metodoPagamento", opt.value)} className="h-5 w-5 shrink-0 accent-gold" />
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-body font-medium text-sm flex items-center gap-2">
                                <span>{opt.icon}</span> {opt.label}
                              </p>
                              <p className="text-xs text-muted-foreground font-body">{opt.desc}</p>
                            </div>
                          </div>
                          {opt.badge && form.metodoPagamento === opt.value && (
                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[10px] font-mono font-bold bg-gold text-foreground px-2 py-0.5 rounded-full">
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
                            <p className="font-body text-sm text-gold-ink font-semibold">💰 Desconto Pix: -{formatBRL(pixDesconto)}</p>
                            <p className="font-mono text-xs text-muted-foreground mt-1">Novo total: {formatBRL(total)}</p>
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
                        <Check className="w-6 h-6 text-gold-ink" />
                      </div>
                      <h2 className="font-display text-xl font-semibold">Revisar Pedido</h2>
                      <p className="font-body text-xs text-muted-foreground mt-1">Confira os dados antes de finalizar</p>
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: "Cliente", value: `${form.nome} · ${form.email}`, step: 0 },
                        { label: "Endereço", value: `${form.logradouro}, ${form.numero} — ${form.bairro}, ${form.cidade}/${form.estado}`, step: 1 },
                        { label: "Envio", value: form.freteNome ? `${form.freteCompany} · ${form.freteNome}${form.fretePrazo ? ` (${form.fretePrazo})` : ""}` : "—", step: 2 },
                        { label: "Pagamento", value: form.metodoPagamento === "pix" ? "Pix (10% desconto)" : "Cartão de Crédito", step: 3 },
                      ].map((item) => (
                        <div key={item.label} className="flex items-start justify-between p-3 bg-muted/20 rounded-lg border border-border/50">
                          <div>
                            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                            <p className="font-body text-sm mt-0.5">{item.value}</p>
                          </div>
                          <button
                            onClick={() => setStep(item.step)}
                            className="font-body text-[10px] text-gold-ink hover:underline underline-offset-2 shrink-0 mt-1"
                          >
                            Editar
                          </button>
                        </div>
                      ))}
                      {form.presente && (
                        <div className="p-3 bg-gold/5 rounded-lg border border-gold/20">
                          <p className="font-body text-[10px] text-gold-ink uppercase tracking-wider flex items-center gap-1"><Gift className="w-3 h-3" /> Presente</p>
                          <p className="font-body text-sm mt-0.5">{form.mensagemPresente || "Sem mensagem"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex flex-wrap gap-3 justify-between mt-8 pt-5 border-t border-border">
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
                      <Button onClick={nextStep} className="font-body text-xs bg-gold text-foreground hover:bg-gold-dark rounded-full uppercase tracking-wide px-4 sm:px-8 h-11">
                        Continuar <ArrowRight className="w-3.5 h-3.5 ml-2" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button
                        onClick={finalizarPedido}
                        disabled={submitting}
                        className="font-body text-xs bg-gold text-foreground hover:bg-gold-dark rounded-full uppercase tracking-wide px-4 sm:px-8 h-11 shadow-[0_0_20px_hsl(var(--gold)/0.2)]"
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
                <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                  Resumo
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items.length} {items.length === 1 ? "item" : "itens"}</span>
                </h2>
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
                      <span className="font-mono text-xs font-semibold shrink-0 text-gold-ink">
                        {formatBRL(((item.precoPromocional ?? item.preco) * item.quantidade))}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-3 space-y-2 text-sm font-body">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatBRL(subtotal)}</span>
                  </div>
                  {desconto > 0 && (
                    <div className="flex justify-between text-gold-ink">
                      <span>Cupom ({cupom})</span>
                      <span className="font-mono">-{formatBRL(desconto)}</span>
                    </div>
                  )}
                  {freteZeradoPorCupom && (
                    <div className="flex justify-between text-gold-ink">
                      <span>Cupom ({cupom})</span>
                      <span className="font-mono">Frete grátis</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Frete</span>
                    <span className={`font-mono ${custoFrete === 0 ? "text-gold-ink" : ""}`}>
                      {!form.frete ? "A calcular" : custoFrete === 0 ? "Grátis" : formatBRL(custoFrete)}
                    </span>
                  </div>
                  {pixDesconto > 0 && (
                    <div className="flex justify-between text-gold-ink">
                      <span>Desconto Pix</span>
                      <span className="font-mono">-{formatBRL(pixDesconto)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-base pt-3 border-t border-border">
                    <span>Total</span>
                    <span className="font-mono text-gold-ink">{formatBRL(total)}</span>
                  </div>
                </div>

                {/* Security footer */}
                <div className="pt-3 border-t border-border/50 flex items-center justify-center gap-4">
                  {TRUST_BADGES.slice(0, 2).map((b) => (
                    <div key={b.label} className="flex items-center gap-1 text-muted-foreground">
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

/** Form fields for a chosen shipping option (price always from the latest quote). */
function freteSelection(opt: { id: string; name: string; company: string; price: number; delivery_time?: number | null; delivery_range?: { min: number; max: number } | null }) {
  const fretePrazo = opt.delivery_range
    ? `${opt.delivery_range.min}-${opt.delivery_range.max} dias úteis`
    : opt.delivery_time ? `até ${opt.delivery_time} dias úteis` : "";
  return { frete: opt.id, freteNome: opt.name, freteCompany: opt.company, fretePreco: opt.price, fretePrazo };
}

/** Reads the server's 409 total_drift response (thrown by functions.invoke as an HTTP error). */
async function readTotalDrift(error: unknown): Promise<number | null> {
  const ctx = (error as { context?: { status?: number; json?: () => Promise<unknown> } } | null)?.context;
  if (!ctx || ctx.status !== 409 || typeof ctx.json !== "function") return null;
  try {
    const body = (await ctx.json()) as { code?: string; validated?: { total?: unknown } };
    return body.code === "total_drift" ? moneyValue(body.validated?.total) : null;
  } catch { return null; }
}

interface FreteOption {
  id: string;
  name: string;
  company: string;
  company_picture?: string | null;
  price: number;
  original_price?: number;
  free?: boolean;
  delivery_time?: number | null;
  delivery_range?: { min: number; max: number } | null;
}

export default CheckoutPage;
