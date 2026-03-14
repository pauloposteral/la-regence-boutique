import { motion } from "framer-motion";
import { Star, ShoppingBag, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useProdutos } from "@/hooks/useProdutos";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

const CoffeeCarousel = () => {
  const { data: produtos = [], isLoading } = useProdutos();
  const destaques = produtos.filter((p) => p.destaque).slice(0, 4);
  const items = destaques.length > 0 ? destaques : produtos.slice(0, 4);
  const { addItem, openCart } = useCart();

  const handleQuickAdd = (e: React.MouseEvent, coffee: typeof items[0]) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      produtoId: coffee.id,
      nome: coffee.nome,
      preco: coffee.preco,
      precoPromocional: coffee.preco_promocional || undefined,
      quantidade: 1,
      imagemUrl: coffee.imagens?.find((i) => i.principal)?.url || coffee.imagens?.[0]?.url,
      slug: coffee.slug,
    });
    toast.success(`${coffee.nome} adicionado ao carrinho`, {
      action: { label: "Ver carrinho", onClick: () => openCart() },
    });
  };

  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-[11px] font-body tracking-[0.3em] uppercase text-gold mb-4">Seleção Especial</p>
          <h2 className="font-display text-3xl lg:text-5xl font-bold text-brown-dark">Nossos Cafés</h2>
          <p className="text-sm text-muted-foreground font-body mt-4 max-w-xl mx-auto leading-relaxed">
            Cafés especiais com pontuação SCA acima de 80 pontos, 
            selecionados e torrados artesanalmente.
          </p>
          <div className="w-16 h-px bg-gradient-to-r from-gold/0 via-gold to-gold/0 mx-auto mt-6" />
        </motion.div>

        {isLoading || items.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-cream-400 overflow-hidden">
                <div className="aspect-square bg-cream-200 shimmer-gold" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-cream-300 rounded w-3/4 shimmer-gold" />
                  <div className="h-3 bg-cream-300 rounded w-1/2 shimmer-gold" />
                  <div className="h-5 bg-cream-300 rounded w-1/3 shimmer-gold" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {items.map((coffee, i) => {
              const basePrice = coffee.preco_promocional || coffee.preco;
              const pixPrice = basePrice * 0.9;
              const parcela = coffee.preco / 3;
              const lowStock = coffee.estoque > 0 && coffee.estoque <= 5;

              return (
                <motion.div
                  key={coffee.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={`/cafe/${coffee.slug}`}
                    className="group block bg-card rounded-2xl overflow-hidden border border-cream-300 hover:border-gold/30 card-tilt transition-all duration-500"
                  >
                    <div className="aspect-square bg-cream-100 flex items-center justify-center relative overflow-hidden p-6">
                      {coffee.imagens && coffee.imagens.length > 0 ? (
                        <img
                          src={coffee.imagens.find((i) => i.principal)?.url || coffee.imagens[0]?.url}
                          alt={coffee.nome}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-6xl group-hover:scale-110 transition-transform duration-700">☕</span>
                      )}
                      {coffee.sca_score && (
                        <div className="absolute top-3 right-3 bg-white/90 text-foreground font-mono text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-sm">
                          <Star className="w-3 h-3 fill-gold text-gold" />
                          SCA {coffee.sca_score}
                        </div>
                      )}
                      {lowStock && (
                        <div className="absolute bottom-3 left-3 bg-destructive text-destructive-foreground text-[10px] font-body font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Últimas {coffee.estoque} un.
                        </div>
                      )}
                    </div>

                    <div className="p-5 lg:p-6">
                      <h3 className="font-display text-base lg:text-lg font-semibold text-brown-dark group-hover:text-gold transition-colors duration-300 leading-tight min-h-[2.5rem]">
                        {coffee.nome}
                      </h3>

                      {/* Intensity bars */}
                      {coffee.corpo && (
                        <div className="flex items-center gap-1 mt-3">
                          <span className="text-[10px] font-body text-muted-foreground mr-1">Corpo</span>
                          {Array.from({ length: 5 }).map((_, s) => (
                            <div
                              key={s}
                              className={`w-3 h-1.5 rounded-sm ${s < coffee.corpo! ? "bg-brown" : "bg-cream-400"}`}
                            />
                          ))}
                        </div>
                      )}

                      {coffee.notas_sensoriais && coffee.notas_sensoriais.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {coffee.notas_sensoriais.slice(0, 3).map((nota) => (
                            <span key={nota} className="text-[10px] font-body text-muted-foreground border border-cream-400 rounded-full px-2 py-0.5 hover:border-gold hover:text-gold transition-colors">
                              {nota}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="font-mono font-bold text-xl text-brown-dark mt-4">
                        R$ {coffee.preco.toFixed(2).replace(".", ",")}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-body mt-0.5">
                        Em até 3x de R$ {parcela.toFixed(2).replace(".", ",")} s/ juros
                      </p>

                      <div className="mt-3 border border-gold/20 rounded-xl px-3 py-2 text-center bg-gold/[0.04]">
                        <span className="text-xs font-body font-semibold text-gold flex items-center justify-center gap-1.5">
                          À vista R$ {pixPrice.toFixed(2).replace(".", ",")} no Pix
                        </span>
                      </div>

                      {/* Quick-add button */}
                      <Button
                        size="sm"
                        className="w-full mt-3 font-body text-xs bg-gold text-white hover:bg-gold-dark tracking-wide uppercase transition-all duration-300 hover:shadow-[0_4px_12px_hsl(var(--gold)/0.25)] hover:scale-[1.02]"
                        onClick={(e) => handleQuickAdd(e, coffee)}
                      >
                        <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                        Adicionar ao carrinho
                      </Button>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default CoffeeCarousel;
