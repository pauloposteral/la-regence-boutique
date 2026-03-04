import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Check, MapPin, CreditCard, Truck, User, Gift } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

const STEPS = [
  { id: "identificacao", label: "Identificação", icon: User },
  { id: "endereco", label: "Endereço", icon: MapPin },
  { id: "envio", label: "Envio", icon: Truck },
  { id: "pagamento", label: "Pagamento", icon: CreditCard },
  { id: "confirmacao", label: "Confirmação", icon: Check },
];

const FRETE_GRATIS_MIN = 150;

const CheckoutPage = () => {
  const { items, subtotal, desconto, cupom, clearCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    nome: "", email: "", telefone: "", cpf: "",
    cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
    frete: "padrao" as "padrao" | "expresso",
    presente: false, mensagemPresente: "",
  });

  const [cepLoading, setCepLoading] = useState(false);

  const freteGratis = subtotal >= FRETE_GRATIS_MIN;
  const custoFrete = freteGratis ? 0 : form.frete === "expresso" ? 29.90 : 14.90;
  const total = Math.max(0, subtotal - desconto + custoFrete);

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const buscarCep = async () => {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) { toast.error("CEP inválido"); return; }
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) { toast.error("CEP não encontrado"); return; }
      setForm((prev) => ({
        ...prev,
        logradouro: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        estado: data.uf || "",
      }));
    } catch {
      toast.error("Erro ao buscar CEP");
    } finally {
      setCepLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 0) {
      if (!form.nome || !form.email) { toast.error("Preencha nome e e-mail"); return; }
    }
    if (step === 1) {
      if (!form.cep || !form.logradouro || !form.numero || !form.cidade || !form.estado) {
        toast.error("Preencha todos os campos do endereço"); return;
      }
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const prevStep = () => { if (step > 0) setStep(step - 1); };

  const finalizarPedido = () => {
    toast.success("Pedido realizado com sucesso! 🎉");
    clearCart();
    navigate("/");
  };

  if (items.length === 0 && step < 4) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="font-display text-2xl mb-4">Seu carrinho está vazio</p>
          <Button asChild variant="outline"><Link to="/cafes">Ver Cafés</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-4xl">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-body transition-colors ${
                    done ? "bg-accent text-accent-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-body mt-1.5 ${active || done ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${i < step ? "bg-accent" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Form area */}
          <div className="lg:col-span-2">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              {/* Step 0: Identificação */}
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold mb-4">Identificação</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-body text-xs">Nome completo *</Label>
                      <Input value={form.nome} onChange={(e) => updateField("nome", e.target.value)} className="font-body" />
                    </div>
                    <div>
                      <Label className="font-body text-xs">E-mail *</Label>
                      <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="font-body" />
                    </div>
                    <div>
                      <Label className="font-body text-xs">Telefone</Label>
                      <Input value={form.telefone} onChange={(e) => updateField("telefone", e.target.value)} className="font-body" />
                    </div>
                    <div>
                      <Label className="font-body text-xs">CPF</Label>
                      <Input value={form.cpf} onChange={(e) => updateField("cpf", e.target.value)} className="font-body" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Endereço */}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold mb-4">Endereço de Entrega</h2>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="font-body text-xs">CEP *</Label>
                      <Input value={form.cep} onChange={(e) => updateField("cep", e.target.value)} placeholder="00000-000" className="font-body" />
                    </div>
                    <Button variant="outline" className="self-end font-body text-xs" onClick={buscarCep} disabled={cepLoading}>
                      {cepLoading ? "..." : "Buscar"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <Label className="font-body text-xs">Logradouro *</Label>
                      <Input value={form.logradouro} onChange={(e) => updateField("logradouro", e.target.value)} className="font-body" />
                    </div>
                    <div>
                      <Label className="font-body text-xs">Número *</Label>
                      <Input value={form.numero} onChange={(e) => updateField("numero", e.target.value)} className="font-body" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-body text-xs">Complemento</Label>
                      <Input value={form.complemento} onChange={(e) => updateField("complemento", e.target.value)} className="font-body" />
                    </div>
                    <div>
                      <Label className="font-body text-xs">Bairro *</Label>
                      <Input value={form.bairro} onChange={(e) => updateField("bairro", e.target.value)} className="font-body" />
                    </div>
                    <div>
                      <Label className="font-body text-xs">Cidade *</Label>
                      <Input value={form.cidade} onChange={(e) => updateField("cidade", e.target.value)} className="font-body" />
                    </div>
                    <div>
                      <Label className="font-body text-xs">Estado *</Label>
                      <Input value={form.estado} onChange={(e) => updateField("estado", e.target.value)} className="font-body" maxLength={2} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Envio */}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold mb-4">Método de Envio</h2>
                  {[
                    { value: "padrao", label: "Padrão", desc: "5 a 10 dias úteis", price: freteGratis ? "Grátis" : "R$ 14,90" },
                    { value: "expresso", label: "Expresso", desc: "2 a 4 dias úteis", price: freteGratis ? "Grátis" : "R$ 29,90" },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                        form.frete === opt.value ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${form.frete === opt.value ? "border-accent bg-accent" : "border-muted-foreground"}`}>
                          {form.frete === opt.value && <div className="w-full h-full rounded-full bg-accent" />}
                        </div>
                        <div>
                          <p className="font-body font-medium text-sm">{opt.label}</p>
                          <p className="text-xs text-muted-foreground font-body">{opt.desc}</p>
                        </div>
                      </div>
                      <span className="font-body font-semibold text-sm">{opt.price}</span>
                    </label>
                  ))}

                  {/* Gift option */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Checkbox
                        checked={form.presente}
                        onCheckedChange={(v) => updateField("presente", !!v)}
                        id="presente"
                      />
                      <Label htmlFor="presente" className="font-body text-sm flex items-center gap-1.5 cursor-pointer">
                        <Gift className="w-4 h-4 text-accent" /> É um presente
                      </Label>
                    </div>
                    {form.presente && (
                      <Input
                        placeholder="Mensagem personalizada (opcional)"
                        value={form.mensagemPresente}
                        onChange={(e) => updateField("mensagemPresente", e.target.value)}
                        className="font-body text-sm"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Pagamento */}
              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold mb-4">Pagamento</h2>
                  <div className="bg-muted/50 rounded-lg p-6 text-center">
                    <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="font-body text-sm text-muted-foreground mb-1">
                      Ao confirmar, você será redirecionado para o Stripe para pagamento seguro.
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      Cartão de crédito · Parcelamento em até 3x sem juros
                    </p>
                  </div>
                  <div className="bg-accent/10 rounded-lg p-4 text-center">
                    <p className="font-body text-sm text-accent font-medium">
                      💰 Pague via Pix e ganhe 10% de desconto!
                    </p>
                    <p className="font-body text-xs text-muted-foreground mt-1">
                      Total no Pix: R$ {(total * 0.9).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmação */}
              {step === 4 && (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-accent" />
                  </div>
                  <h2 className="font-display text-2xl font-semibold">Confirmar Pedido</h2>
                  <div className="text-left bg-muted/30 rounded-lg p-4 space-y-1 text-sm font-body">
                    <p><strong>Nome:</strong> {form.nome}</p>
                    <p><strong>E-mail:</strong> {form.email}</p>
                    <p><strong>Endereço:</strong> {form.logradouro}, {form.numero} — {form.cidade}/{form.estado}</p>
                    <p><strong>Envio:</strong> {form.frete === "expresso" ? "Expresso" : "Padrão"}</p>
                    {form.presente && <p><strong>Presente:</strong> Sim</p>}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-6 pt-4 border-t border-border">
                {step > 0 ? (
                  <Button variant="ghost" onClick={prevStep} className="font-body text-sm">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                  </Button>
                ) : (
                  <div />
                )}
                {step < 4 ? (
                  <Button onClick={nextStep} className="font-body text-sm">
                    Continuar
                  </Button>
                ) : (
                  <Button onClick={finalizarPedido} className="font-body text-sm bg-accent text-accent-foreground hover:bg-accent/90">
                    Confirmar e Pagar
                  </Button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-5 sticky top-24 space-y-4">
              <h3 className="font-display text-lg font-semibold">Resumo do Pedido</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={`${item.produtoId}-${item.varianteId}`} className="flex gap-3">
                    <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center shrink-0">
                      {item.imagemUrl ? (
                        <img src={item.imagemUrl} alt="" className="w-full h-full object-cover rounded" />
                      ) : (
                        <span className="text-lg">☕</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-xs font-medium truncate">{item.nome}</p>
                      <p className="text-[10px] text-muted-foreground font-body">Qtd: {item.quantidade}</p>
                    </div>
                    <span className="font-body text-xs font-semibold shrink-0">
                      R$ {((item.precoPromocional || item.preco) * item.quantidade).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 space-y-1.5 text-sm font-body">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
                </div>
                {desconto > 0 && (
                  <div className="flex justify-between text-accent">
                    <span>Cupom ({cupom})</span>
                    <span>-R$ {desconto.toFixed(2).replace(".", ",")}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Frete</span>
                  <span>{custoFrete === 0 ? "Grátis" : `R$ ${custoFrete.toFixed(2).replace(".", ",")}`}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2).replace(".", ",")}</span>
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
