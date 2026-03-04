import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CrossSellProducts from "./CrossSellProducts";

const FRETE_GRATIS_MIN = 150;

const MOAGEM_LABELS: Record<string, string> = {
  graos: "Grãos", grossa: "Grossa", media: "Média", fina: "Fina", extra_fina: "Extra Fina",
};

const CartDrawer = () => {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, totalItems, cupom, desconto, setCupom, setDesconto } = useCart();
  const [cupomInput, setCupomInput] = useState("");
  const [cupomLoading, setCupomLoading] = useState(false);

  const faltaFreteGratis = Math.max(0, FRETE_GRATIS_MIN - subtotal);
  const progressoFrete = Math.min(100, (subtotal / FRETE_GRATIS_MIN) * 100);

  const aplicarCupom = async () => {
    if (!cupomInput.trim()) return;
    setCupomLoading(true);
    try {
      const { data, error } = await supabase
        .from("cupons")
        .select("*")
        .eq("codigo", cupomInput.trim().toUpperCase())
        .eq("ativo", true)
        .single();

      if (error || !data) { toast.error("Cupom inválido ou expirado"); return; }
      if (data.valor_minimo && subtotal < Number(data.valor_minimo)) {
        toast.error(`Valor mínimo de R$ ${Number(data.valor_minimo).toFixed(2).replace(".", ",")} para este cupom`);
        return;
      }
      if (data.valido_ate && new Date(data.valido_ate) < new Date()) { toast.error("Cupom expirado"); return; }

      let desc = 0;
      if (data.desconto_percentual) desc = subtotal * (Number(data.desconto_percentual) / 100);
      else if (data.desconto_valor) desc = Number(data.desconto_valor);

      setCupom(data.codigo);
      setDesconto(desc);
      toast.success(`Cupom "${data.codigo}" aplicado! -R$ ${desc.toFixed(2).replace(".", ",")}`);
    } catch { toast.error("Erro ao validar cupom"); }
    finally { setCupomLoading(false); }
  };

  const total = Math.max(0, subtotal - desconto);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={closeCart} />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <h2 className="font-display text-xl font-semibold">Carrinho</h2>
                <span className="text-xs font-body text-muted-foreground">({totalItems})</span>
              </div>
              <button onClick={closeCart} className="p-1 hover:bg-muted rounded transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Free shipping bar */}
            {items.length > 0 && (
              <div className="px-5 py-3 bg-card border-b border-border">
                <div className="flex items-center justify-between text-xs font-body mb-1.5">
                  {faltaFreteGratis > 0 ? (
                    <span className="text-muted-foreground">
                      Faltam <strong className="text-foreground">R$ {faltaFreteGratis.toFixed(2).replace(".", ",")}</strong> para frete grátis
                    </span>
                  ) : (
                    <span className="text-accent font-medium">🎉 Frete grátis!</span>
                  )}
                  <span className="text-muted-foreground">R$ {FRETE_GRATIS_MIN},00</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div className="h-full bg-accent rounded-full" initial={{ width: 0 }} animate={{ width: `${progressoFrete}%` }} transition={{ duration: 0.5 }} />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="font-display text-lg text-muted-foreground mb-2">Seu carrinho está vazio</p>
                  <p className="font-body text-sm text-muted-foreground mb-6">Explore nossos cafés e encontre o sabor perfeito.</p>
                  <Button asChild variant="outline" onClick={closeCart}><Link to="/cafes">Ver Cafés</Link></Button>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={`${item.produtoId}-${item.varianteId}`}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-3 bg-card rounded-lg p-3 border border-border"
                    >
                      <div className="w-16 h-16 bg-secondary rounded flex items-center justify-center shrink-0 overflow-hidden">
                        {item.imagemUrl ? <img src={item.imagemUrl} alt={item.nome} className="w-full h-full object-cover" loading="lazy" /> : <span className="text-2xl">☕</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link to={`/cafe/${item.slug}`} className="font-display text-sm font-semibold truncate block hover:text-accent transition-colors" onClick={closeCart}>{item.nome}</Link>
                        <p className="text-[10px] text-muted-foreground font-body">
                          {item.moagem && MOAGEM_LABELS[item.moagem]}{item.peso && ` · ${item.peso >= 1000 ? `${item.peso / 1000}kg` : `${item.peso}g`}`}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-border rounded">
                            <button onClick={() => updateQuantity(item.produtoId, item.varianteId, item.quantidade - 1)} className="p-1 hover:bg-muted transition-colors"><Minus className="w-3 h-3" /></button>
                            <span className="w-7 text-center text-xs font-body">{item.quantidade}</span>
                            <button onClick={() => updateQuantity(item.produtoId, item.varianteId, item.quantidade + 1)} className="p-1 hover:bg-muted transition-colors"><Plus className="w-3 h-3" /></button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-body font-semibold text-sm">R$ {((item.precoPromocional || item.preco) * item.quantidade).toFixed(2).replace(".", ",")}</span>
                            <button onClick={() => removeItem(item.produtoId, item.varianteId)} className="p-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Cross-sell */}
            {items.length > 0 && <CrossSellProducts />}

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border p-5 space-y-4">
                {!cupom ? (
                  <div className="flex gap-2">
                    <Input placeholder="Cupom de desconto" value={cupomInput} onChange={(e) => setCupomInput(e.target.value)} className="font-body text-sm" />
                    <Button variant="outline" size="sm" onClick={aplicarCupom} disabled={cupomLoading} className="font-body text-xs shrink-0">Aplicar</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-accent/10 rounded px-3 py-2">
                    <span className="text-xs font-body font-medium text-accent">Cupom: {cupom} (-R$ {desconto.toFixed(2).replace(".", ",")})</span>
                    <button onClick={() => { setCupom(null); setDesconto(0); }} className="text-xs text-muted-foreground hover:text-destructive"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}

                <div className="space-y-1.5 text-sm font-body">
                  <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>R$ {subtotal.toFixed(2).replace(".", ",")}</span></div>
                  {desconto > 0 && <div className="flex justify-between text-accent"><span>Desconto</span><span>-R$ {desconto.toFixed(2).replace(".", ",")}</span></div>}
                  <div className="flex justify-between text-muted-foreground"><span>Frete</span><span>{subtotal >= FRETE_GRATIS_MIN ? "Grátis" : "Calculado no checkout"}</span></div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-border"><span>Total</span><span>R$ {total.toFixed(2).replace(".", ",")}</span></div>
                  <p className="text-[10px] text-accent text-right">R$ {(total * 0.9).toFixed(2).replace(".", ",")} no Pix (10% off)</p>
                </div>

                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button asChild className="w-full font-body text-sm tracking-wide" size="lg" onClick={closeCart}>
                    <Link to="/checkout">Finalizar Compra <ArrowRight className="w-4 h-4 ml-1" /></Link>
                  </Button>
                </motion.div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
