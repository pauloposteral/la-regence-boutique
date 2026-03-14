import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingBag, Minus, Plus, X, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import type { Produto } from "@/hooks/useProdutos";

interface QuickViewModalProps {
  produto: Produto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickViewModal = ({ produto, open, onOpenChange }: QuickViewModalProps) => {
  const [quantidade, setQuantidade] = useState(1);
  const { addItem, openCart } = useCart();

  if (!produto) return null;

  const mainImg = produto.imagens?.find((i) => i.principal)?.url || produto.imagens?.[0]?.url;
  const pixPrice = (produto.preco_promocional || produto.preco) * 0.9;
  const displayPrice = produto.preco_promocional || produto.preco;

  const handleAdd = () => {
    addItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      precoPromocional: produto.preco_promocional || undefined,
      quantidade,
      imagemUrl: mainImg,
      slug: produto.slug,
    });
    toast.success(`${produto.nome} adicionado ao carrinho`, {
      action: { label: "Ver carrinho", onClick: () => openCart() },
    });
    onOpenChange(false);
    setQuantidade(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-xl border-cream-400">
        <DialogTitle className="sr-only">{produto.nome}</DialogTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Image */}
          <div className="aspect-square bg-cream-200 relative overflow-hidden">
            {mainImg ? (
              <img src={mainImg} alt={produto.nome} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">☕</div>
            )}
            {produto.sca_score && (
              <div className="absolute top-3 right-3 bg-cream-50/90 text-brown font-mono text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-gold text-gold" />SCA {produto.sca_score}
              </div>
            )}
            {produto.preco_promocional && (
              <div className="absolute top-3 left-3 bg-gold text-white text-[10px] font-body font-bold px-2.5 py-1 rounded-full">
                {Math.round((1 - produto.preco_promocional / produto.preco) * 100)}% OFF
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-6 flex flex-col">
            {produto.categoria && (
              <span className="text-[10px] font-body text-gold uppercase tracking-[0.2em] mb-1">{produto.categoria.nome}</span>
            )}
            <h3 className="font-display text-xl font-semibold text-brown-dark mb-2">{produto.nome}</h3>

            {produto.notas_sensoriais && produto.notas_sensoriais.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {produto.notas_sensoriais.slice(0, 4).map((nota) => (
                  <Badge key={nota} variant="secondary" className="font-body text-[10px]">{nota}</Badge>
                ))}
              </div>
            )}

            {produto.origem && (
              <p className="text-xs text-muted-foreground font-body mb-3">Origem: {produto.origem}</p>
            )}

            {/* Price */}
            <div className="bg-cream-100 rounded-lg p-3 mb-3">
              <div className="flex items-end gap-2">
                {produto.preco_promocional ? (
                  <>
                    <span className="text-xs text-cream-700 font-body line-through">R$ {produto.preco.toFixed(2).replace(".", ",")}</span>
                    <span className="font-mono font-bold text-2xl text-brown-dark">R$ {produto.preco_promocional.toFixed(2).replace(".", ",")}</span>
                  </>
                ) : (
                  <span className="font-mono font-bold text-2xl text-brown-dark">R$ {produto.preco.toFixed(2).replace(".", ",")}</span>
                )}
              </div>
              <p className="text-[10px] text-gold font-body font-semibold mt-1">
                R$ {pixPrice.toFixed(2).replace(".", ",")} no Pix (10% off)
              </p>
              <p className="text-[10px] text-muted-foreground font-body">
                ou 12x de R$ {(displayPrice / 12).toFixed(2).replace(".", ",")} sem juros
              </p>
            </div>

            <div className="mt-auto space-y-3">
              {/* Quantity + Add */}
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-cream-400 rounded-lg">
                  <button onClick={() => setQuantidade(Math.max(1, quantidade - 1))} className="p-2 hover:bg-cream-200 transition-colors rounded-l-lg">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-body text-sm">{quantidade}</span>
                  <button onClick={() => setQuantidade(quantidade + 1)} className="p-2 hover:bg-cream-200 transition-colors rounded-r-lg">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Button
                  className="flex-1 font-body text-xs bg-gold text-white hover:bg-gold-dark tracking-wide uppercase rounded-full transition-all duration-300"
                  disabled={produto.estoque === 0}
                  onClick={handleAdd}
                >
                  <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                  {produto.estoque === 0 ? "Indisponível" : "Adicionar"}
                </Button>
              </div>

              {/* View full */}
              <Button asChild variant="outline" className="w-full font-body text-xs border-cream-400 hover:border-gold/30 rounded-full">
                <Link to={`/cafe/${produto.slug}`} onClick={() => onOpenChange(false)}>
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Ver detalhes completos
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickViewModal;
