import { useMemo } from "react";
import { useProdutos } from "@/hooks/useProdutos";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CrossSellProducts = () => {
  const { items, closeCart } = useCart();
  const { addItem } = useCart();
  const { data: produtos = [] } = useProdutos();

  const cartIds = new Set(items.map((i) => i.produtoId));

  // Cross-sell inteligente: prioriza mesma categoria e notas sensoriais similares
  const suggestions = useMemo(() => {
    const available = produtos.filter((p) => !cartIds.has(p.id) && p.estoque > 0);
    if (available.length === 0) return [];

    // Coletar categorias e notas do carrinho
    const cartCategorias = new Set<string>();
    const cartNotas = new Set<string>();
    items.forEach((item) => {
      const produto = produtos.find((p) => p.id === item.produtoId);
      if (produto?.categoria_id) cartCategorias.add(produto.categoria_id);
      produto?.notas_sensoriais?.forEach((n) => cartNotas.add(n));
    });

    // Pontuar cada produto candidato
    const scored = available.map((p) => {
      let score = 0;
      if (p.categoria_id && cartCategorias.has(p.categoria_id)) score += 3;
      if (p.notas_sensoriais) {
        score += p.notas_sensoriais.filter((n) => cartNotas.has(n)).length;
      }
      if (p.destaque) score += 1;
      return { produto: p, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => s.produto);
  }, [produtos, items, cartIds]);

  if (suggestions.length === 0) return null;

  return (
    <div className="px-5 py-4 border-t border-border">
      <p className="text-xs font-body font-medium text-muted-foreground mb-3">Que tal adicionar?</p>
      <div className="space-y-2">
        {suggestions.map((p) => {
          const img = p.imagens?.find((i) => i.principal)?.url || p.imagens?.[0]?.url;
          return (
            <div key={p.id} className="flex items-center gap-2">
              <Link
                to={`/cafe/${p.slug}`}
                onClick={closeCart}
                className="w-10 h-10 rounded bg-secondary overflow-hidden shrink-0 flex items-center justify-center"
              >
                {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <span>☕</span>}
              </Link>
              <div className="flex-1 min-w-0">
                <p className="font-body text-xs font-medium truncate">{p.nome}</p>
                <p className="font-body text-[10px] text-muted-foreground">
                  R$ {(p.preco_promocional || p.preco).toFixed(2).replace(".", ",")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => {
                  addItem({
                    produtoId: p.id,
                    nome: p.nome,
                    preco: p.preco,
                    precoPromocional: p.preco_promocional || undefined,
                    quantidade: 1,
                    imagemUrl: img,
                    slug: p.slug,
                  });
                  toast.success(`${p.nome} adicionado!`);
                }}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CrossSellProducts;
