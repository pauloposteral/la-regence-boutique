import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useProdutos } from "@/hooks/useProdutos";

const CoffeeCarousel = () => {
  const { data: produtos = [], isLoading } = useProdutos();
  const destaques = produtos.filter((p) => p.destaque).slice(0, 5);
  const items = destaques.length > 0 ? destaques : produtos.slice(0, 5);

  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-accent text-xs font-body tracking-[0.3em] uppercase">Seleção Especial</span>
          <h2 className="font-display text-4xl lg:text-5xl font-light mt-3">
            Nossos <span className="italic font-medium">Cafés</span>
          </h2>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border animate-pulse">
                <div className="aspect-[3/4] bg-muted rounded-t-lg" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {items.map((coffee, i) => (
              <motion.div
                key={coffee.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={`/cafe/${coffee.slug}`}
                  className="group block bg-card rounded-lg overflow-hidden border border-border hover:border-accent/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="aspect-[3/4] bg-secondary flex items-center justify-center relative overflow-hidden">
                    {coffee.imagens && coffee.imagens.length > 0 ? (
                      <img
                        src={coffee.imagens.find((i) => i.principal)?.url || coffee.imagens[0]?.url}
                        alt={coffee.nome}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <span className="text-5xl group-hover:scale-110 transition-transform duration-500">☕</span>
                    )}
                    {coffee.sca_score && (
                      <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-body font-semibold px-2 py-1 rounded flex items-center gap-1">
                        <Star className="w-3 h-3 fill-gold text-gold" />
                        SCA {coffee.sca_score}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-lg font-semibold">{coffee.nome}</h3>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      {coffee.notas_sensoriais?.join(" · ")}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-body font-semibold text-foreground">
                        R$ {coffee.preco.toFixed(2).replace(".", ",")}
                      </span>
                      <span className="text-[10px] text-accent font-body">10% off no Pix</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CoffeeCarousel;
