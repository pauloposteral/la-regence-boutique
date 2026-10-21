import { formatBRL, moneyValue } from "@/lib/money";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CrossSellProducts from "./CrossSellProducts";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const FRETE_GRATIS_MIN = 150;

const MOAGEM_LABELS: Record<string, string> = {
  graos: "Grãos", grossa: "Grossa", media: "Média", fina: "Fina", extra_fina: "Extra Fina",
};

const CartDrawer = () => {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, totalItems, cupom, desconto, cupomTipo, setCupom, setDesconto, setCupomTipo } = useCart();
  const [cupomInput, setCupomInput] = useState("");
  const [cupomLoading, setCupomLoading] = useState(false);

  const faltaFreteGratis = Math.max(0, FRETE_GRATIS_MIN - subtotal);
  const progressoFrete = Math.min(100, (subtotal / FRETE_GRATIS_MIN) * 100);

  const aplicarCupom = async () => {
    const code = cupomInput.trim().toUpperCase();
    if (!code) return;
    setCupomLoading(true);
    try {
      const { data, error } = await supabase.rpc("preview_coupon", {
        _codigo: code,
        _subtotal: subtotal,
      });
      if (error) { toast.error("Erro ao validar cupom"); return; }
      const row = Array.isArray(data) ? data[0] : data;
      const motivo = row?.motivo;
      const tipo = (row?.tipo as "desconto" | "frete_gratis" | undefined) || "desconto";

      if (motivo !== "ok") {
        const msg: Record<string, string> = {
          invalido: "Cupom inválido",
          expirado: "Cupom expirado",
          esgotado: "Cupom esgotado",
          valor_minimo: "Valor mínimo não atingido para este cupom",
        };
        toast.error(msg[motivo || ""] || "Cupom inválido");
        return;
      }
      const desc = moneyValue(row?.desconto);
      if (tipo === "desconto" && desc <= 0) {
        toast.error("Cupom inválido");
        return;
      }
      setCupom(code);
      setDesconto(desc);
      setCupomTipo(tipo);
      if (tipo === "frete_gratis") {
        toast.success(`Cupom "${code}" aplicado! Frete grátis 🚚`);
      } else {
        toast.success(`Cupom "${code}" aplicado! -${formatBRL(desc)}`);
      }
    } catch { toast.error("Erro ao validar cupom"); }
    finally { setCupomLoading(false); }
  };

  const total = Math.max(0, subtotal - desconto);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) closeCart(); }}>
      {isOpen && (
        <>
          <SheetContent aria-describedby={undefined} className="w-full max-w-md sm:max-w-md bg-cream-50 flex flex-col gap-0 p-0 shadow-2xl [&>button]:hidden">
            {/* Gold top accent */}
            <div className="h-1 bg-gradient-to-r from-gold/60 via-gold to-gold/60" />

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-cream-400">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brown-dark" />
                <SheetTitle className="font-display text-xl font-semibold text-brown-dark">Carrinho</SheetTitle>
                <span className="text-xs font-body text-muted-foreground">({totalItems})</span>
              </div>
              <button aria-label="Fechar carrinho" onClick={closeCart} className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-cream-200 rounded-full transition-colors"><X className="w-5 h-5 text-brown" /></button>
            </div>

            {/* Free shipping bar */}
            {items.length > 0 && (
              <div className="px-5 py-3 bg-cream-200 border-b border-cream-400">
                <div className="flex items-center justify-between text-xs font-body mb-1.5">
                  {faltaFreteGratis > 0 ? (
                    <>
                      <span className="text-brown">
                        Faltam <strong className="text-brown-dark">{formatBRL(faltaFreteGratis)}</strong> para frete grátis
                      </span>
                      <span className="text-muted-foreground">{formatBRL(FRETE_GRATIS_MIN)}</span>
                    </>
                  ) : (
                    <span className="text-gold-ink font-medium">🎉 Você ganhou frete grátis!</span>
                  )}
                </div>
                <div className="w-full h-1.5 bg-cream-400 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gold rounded-full" initial={{ width: 0 }} animate={{ width: `${progressoFrete}%` }} transition={{ duration: 0.5 }} />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                  <ShoppingBag className="w-12 h-12 text-cream-500 mb-4" />
                  <p className="font-display text-lg text-brown mb-2">Seu carrinho está vazio</p>
                  <p className="font-body text-sm text-muted-foreground mb-6">Explore nossos cafés e encontre o sabor perfeito.</p>
                  <Button asChild variant="outline" onClick={closeCart}><Link to="/cafes">Ver Cafés</Link></Button>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {items.map((item) => {
                    const unit = item.precoPromocional ?? item.preco;
                    return (
                    <motion.div
                      key={`${item.produtoId}-${item.varianteId}`}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex gap-3 bg-cream-100 rounded-xl p-3 border border-cream-400"
                    >
                      <div className="w-16 h-16 bg-cream-200 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                        {item.imagemUrl ? <img src={item.imagemUrl} alt={item.nome} className="w-full h-full object-cover" loading="lazy" /> : <span className="text-2xl">☕</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link to={`/cafe/${item.slug}`} className="font-display text-sm font-semibold truncate block text-brown-dark hover:text-gold transition-colors duration-300" onClick={closeCart}>{item.nome}</Link>
                        <p className="text-[10px] text-muted-foreground font-body">
                          {item.moagem && MOAGEM_LABELS[item.moagem]}{item.peso && ` · ${item.peso >= 1000 ? `${item.peso / 1000}kg` : `${item.peso}g`}`}
                          <span className="ml-1 text-muted-foreground">· {formatBRL(unit)} un.</span>
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-cream-400 rounded-full">
                            <button
                              aria-label="Diminuir quantidade"
                              onClick={() => updateQuantity(item.produtoId, item.varianteId, item.quantidade - 1)}
                              className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-cream-200 transition-colors rounded-l-full"
                            >
                              <Minus className="w-4 h-4 text-brown" />
                            </button>
                            <span className="w-8 text-center text-sm font-body text-brown-dark tabular-nums">{item.quantidade}</span>
                            <button
                              aria-label="Aumentar quantidade"
                              onClick={() => updateQuantity(item.produtoId, item.varianteId, item.quantidade + 1)}
                              className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-cream-200 transition-colors rounded-r-full"
                            >
                              <Plus className="w-4 h-4 text-brown" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-body font-semibold text-sm text-brown-dark">{formatBRL((unit * item.quantidade))}</span>
                            <button
                              aria-label="Remover item"
                              onClick={() => { removeItem(item.produtoId, item.varianteId); toast.success("Item removido"); }}
                              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );})}
                </div>
              )}

              {/* Cross-sell (dentro do scroll para não empurrar o footer) */}
              {items.length > 0 && <CrossSellProducts />}
            </div>

            {/* Footer — sticky, sempre visível */}
            {items.length > 0 && (
              <div className="border-t border-cream-400 p-4 pb-safe space-y-3 bg-cream-50 shadow-[0_-8px_24px_-12px_rgba(60,40,20,0.15)]">
                {!cupom ? (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <Input aria-label="Cupom de desconto" placeholder="Cupom de desconto" value={cupomInput} onChange={(e) => setCupomInput(e.target.value)} className="font-body text-base md:text-sm h-11" />
                      <Button variant="outline" size="sm" onClick={aplicarCupom} disabled={cupomLoading} className="font-body text-xs shrink-0 h-11 px-4">Aplicar</Button>
                    </div>
                    {subtotal >= 80 && (
                      <button
                        type="button"
                        onClick={() => setCupomInput("PRIMEIRACOMPRA10")}
                        className="text-[11px] font-body text-gold-ink hover:text-gold-dark transition-colors"
                      >
                        Primeira compra? Use PRIMEIRACOMPRA10 e ganhe 10%
                      </button>
                    )}
                  </div>
                ) : (

                  <div className="flex items-center justify-between bg-gold/10 rounded-lg px-3 py-2">
                    <span className="text-xs font-body font-medium text-gold-ink">Cupom: {cupom} {cupomTipo === "frete_gratis" ? "(Frete grátis)" : `(-${formatBRL(desconto)})`}</span>
                    <button aria-label="Remover cupom" onClick={() => { setCupom(null); setDesconto(0); setCupomTipo(null); }} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                  </div>
                )}

                <div className="space-y-1 text-sm font-body">
                  <div className="flex justify-between text-brown"><span>Subtotal</span><span>{formatBRL(subtotal)}</span></div>
                  {desconto > 0 && <div className="flex justify-between text-gold-ink"><span>Desconto</span><span>-{formatBRL(desconto)}</span></div>}
                  <div className="flex justify-between text-brown"><span>Frete</span><span>{subtotal >= FRETE_GRATIS_MIN ? "Grátis" : "Calculado no checkout"}</span></div>
                  <div className="flex justify-between font-semibold text-base text-brown-dark pt-1.5 border-t border-cream-400"><span>Total</span><span>{formatBRL(total)}</span></div>
                  <p className="text-[10px] text-gold-ink text-right font-medium">{formatBRL((total * 0.9))} no Pix (10% off)</p>
                </div>

                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button asChild className="w-full font-body text-sm tracking-wider uppercase bg-gold text-foreground hover:bg-gold-dark transition-all duration-300 min-h-[52px]" size="lg" onClick={closeCart}>
                    <Link to="/checkout">Finalizar Compra <ArrowRight className="w-4 h-4 ml-1" /></Link>
                  </Button>
                </motion.div>
              </div>
            )}
          </SheetContent>
        </>
      )}
    </Sheet>
  );
};

export default CartDrawer;
