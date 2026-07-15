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
    <div className="px-5 py-4 border-t border-cream-400">
      <p className="font-body text-[11px] tracking-[0.3em] uppercase text-gold mb-3">Que tal adicionar</p>
      <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory -mx-1 px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {suggestions.map((p) => {
          const img = p.imagens?.find((i) => i.principal)?.url || p.imagens?.[0]?.url;
          const preco = p.preco_promocional || p.preco;
          return (
            <div
              key={p.id}
              className="snap-start shrink-0 w-[160px] bg-cream-100 border border-cream-400 rounded-xl p-2 flex flex-col gap-2"
            >
              <Link
                to={`/cafe/${p.slug}`}
                onClick={closeCart}
                className="w-full aspect-square rounded-lg bg-cream-200 overflow-hidden flex items-center justify-center"
              >
                {img ? <img src={img} alt={p.nome} className="w-full h-full object-cover" loading="lazy" /> : <span className="text-2xl">☕</span>}
              </Link>
              <div className="min-w-0">
                <p className="font-display text-xs font-semibold text-brown-dark leading-tight line-clamp-2">{p.nome}</p>
                <p className="font-body text-[11px] text-brown-light mt-0.5">
                  R$ {preco.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-gold/40 text-gold hover:bg-gold hover:text-white text-[10px] tracking-wider uppercase font-body gap-1"
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
                <Plus className="w-3 h-3" /> Adicionar
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CrossSellProducts;
