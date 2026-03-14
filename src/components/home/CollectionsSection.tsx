import { motion } from "framer-motion";
import { Star, ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

const CollectionsSection = () => {
  const { addItem, openCart } = useCart();

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["home-collections"],
    queryFn: async () => {
      const { data: cols } = await supabase
        .from("collections")
        .select("id, nome, slug, descricao, imagem_url")
        .eq("ativo", true)
        .order("ordem", { ascending: true })
        .limit(3);

      if (!cols || cols.length === 0) return [];

      const results = await Promise.all(
        cols.map(async (col) => {
          const { data: cpRows } = await supabase
            .from("collection_produtos")
            .select("produto_id, ordem")
            .eq("collection_id", col.id)
            .order("ordem", { ascending: true })
            .limit(4);

          if (!cpRows || cpRows.length === 0) return { ...col, produtos: [] };

          const productIds = cpRows.map((r) => r.produto_id);
          const { data: produtos } = await supabase
            .from("produtos")
            .select("id, nome, slug, preco, preco_promocional, sca_score, corpo, notas_sensoriais, estoque")
            .in("id", productIds)
            .eq("ativo", true);

          const { data: imagens } = await supabase
            .from("produto_imagens")
            .select("produto_id, url, principal")
            .in("produto_id", productIds);

          const produtosWithImages = (produtos || []).map((p) => ({
            ...p,
            imagens: (imagens || []).filter((img) => img.produto_id === p.id),
          }));

          const ordered = productIds
            .map((id) => produtosWithImages.find((p) => p.id === id))
            .filter(Boolean);

          return { ...col, produtos: ordered };
        })
      );

      return results.filter((c) => c.produtos.length > 0);
    },
    staleTime: 1000 * 60 * 5,
  });

  const handleQuickAdd = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      produtoId: product.id,
      nome: product.nome,
      preco: product.preco,
      precoPromocional: product.preco_promocional || undefined,
      quantidade: 1,
      imagemUrl: product.imagens?.find((i: any) => i.principal)?.url || product.imagens?.[0]?.url,
      slug: product.slug,
    });
    toast.success(`${product.nome} adicionado ao carrinho`, {
      action: { label: "Ver carrinho", onClick: () => openCart() },
    });
  };

  if (isLoading || collections.length === 0) return null;

  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {collections.map((collection: any, ci: number) => (
          <div key={collection.id} className={ci > 0 ? "mt-20" : ""}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4"
            >
              <div>
                <p className="text-[10px] font-body tracking-[0.3em] uppercase text-gold mb-2">Coleção</p>
                <h2 className="font-display text-2xl lg:text-4xl font-bold text-brown-dark">{collection.nome}</h2>
                {collection.descricao && (
                  <p className="text-sm text-muted-foreground font-body mt-2 max-w-lg leading-relaxed">{collection.descricao}</p>
                )}
              </div>
              <Link
                to="/cafes"
                className="flex items-center gap-1.5 text-brown font-body text-xs tracking-wider uppercase hover:text-gold hover:gap-3 transition-all duration-300 shrink-0"
              >
                Ver todos <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {collection.produtos.map((product: any, pi: number) => {
                const pixPrice = (product.preco_promocional || product.preco) * 0.9;
                const imgUrl = product.imagens?.find((i: any) => i.principal)?.url || product.imagens?.[0]?.url;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: pi * 0.08 }}
                  >
                    <Link
                      to={`/cafe/${product.slug}`}
                      className="group block bg-card rounded-2xl overflow-hidden border border-cream-400 hover:border-gold/30 card-tilt transition-all duration-500"
                    >
                      <div className="aspect-square bg-cream-200/30 flex items-center justify-center relative overflow-hidden p-6">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={product.nome}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-6xl group-hover:scale-110 transition-transform duration-700">☕</span>
                        )}
                        {product.sca_score && (
                          <div className="absolute top-3 right-3 bg-card/90 text-brown font-mono text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                            <Star className="w-3 h-3 fill-gold text-gold" /> SCA {product.sca_score}
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="font-display text-base font-semibold text-brown-dark group-hover:text-gold transition-colors duration-300 leading-tight min-h-[2.5rem]">
                          {product.nome}
                        </h3>

                        {product.notas_sensoriais && product.notas_sensoriais.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {product.notas_sensoriais.slice(0, 2).map((nota: string) => (
                              <span key={nota} className="text-[10px] font-body text-muted-foreground border border-cream-400 rounded-full px-2 py-0.5 hover:border-gold hover:text-gold transition-colors">
                                {nota}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="font-mono font-bold text-lg text-brown-dark">
                            R$ {product.preco.toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                        <p className="text-[10px] text-gold font-body font-medium mt-0.5">
                          R$ {pixPrice.toFixed(2).replace(".", ",")} no Pix
                        </p>

                        <Button
                          size="sm"
                          className="w-full mt-3 font-body text-xs bg-gold text-white hover:bg-gold-dark tracking-wide uppercase hover:shadow-[0_4px_12px_hsl(var(--gold)/0.25)]"
                          onClick={(e) => handleQuickAdd(e, product)}
                        >
                          <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                          Adicionar
                        </Button>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CollectionsSection;
