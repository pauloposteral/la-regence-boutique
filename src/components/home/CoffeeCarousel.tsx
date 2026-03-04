import { motion } from "framer-motion";
import { Star, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useProdutos } from "@/hooks/useProdutos";
import { Button } from "@/components/ui/button";

const sensorIcons: Record<string, string> = {
  chocolate: "🍫",
  caramelo: "🍮",
  frutado: "🍒",
  citrus: "🍊",
  cítrico: "🍋",
  floral: "🌸",
  castanhas: "🥜",
  nozes: "🥜",
  mel: "🍯",
  baunilha: "🍦",
  especiarias: "🌶️",
  amêndoa: "🥜",
  laranja: "🍊",
};

const getSensorIcon = (nota: string) => {
  const lower = nota.toLowerCase();
  for (const [key, icon] of Object.entries(sensorIcons)) {
    if (lower.includes(key)) return icon;
  }
  return "☕";
};

const CoffeeCarousel = () => {
  const { data: produtos = [], isLoading } = useProdutos();
  const destaques = produtos.filter((p) => p.destaque).slice(0, 4);
  const items = destaques.length > 0 ? destaques : produtos.slice(0, 4);

  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-display text-3xl lg:text-4xl font-semibold">
            Nossos Cafés
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-3 max-w-xl mx-auto leading-relaxed">
            Experimente nossos cafés especiais, com pontuação SCA acima de 80 pontos, 
            selecionados e torrados artesanalmente para uma experiência sensorial incomparável.
          </p>
          {/* Decorative line */}
          <div className="w-16 h-0.5 bg-accent mx-auto mt-5" />
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="aspect-square bg-muted shimmer-gold" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4 shimmer-gold" />
                  <div className="h-3 bg-muted rounded w-1/2 shimmer-gold" />
                  <div className="h-5 bg-muted rounded w-1/3 shimmer-gold" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((coffee, i) => {
              const basePrice = coffee.preco_promocional || coffee.preco;
              const pixPrice = basePrice * 0.9;
              const parcela = coffee.preco / 3;

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
                    className="group block bg-card rounded-xl overflow-hidden border border-border hover:border-accent/40 hover:shadow-[0_8px_30px_-12px_hsl(var(--gold)/0.3)] transition-all duration-300"
                  >
                    {/* Image - square aspect */}
                    <div className="aspect-square bg-secondary flex items-center justify-center relative overflow-hidden p-4">
                      {coffee.imagens && coffee.imagens.length > 0 ? (
                        <img
                          src={coffee.imagens.find((i) => i.principal)?.url || coffee.imagens[0]?.url}
                          alt={coffee.nome}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-6xl group-hover:scale-110 transition-transform duration-500">☕</span>
                      )}
                      {coffee.sca_score && (
                        <div className="absolute top-3 right-3 bg-accent text-accent-foreground text-[10px] font-body font-semibold px-2 py-1 rounded flex items-center gap-1 shadow-sm">
                          <Star className="w-3 h-3 fill-current" />
                          SCA {coffee.sca_score}
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      {/* Name */}
                      <h3 className="font-display text-base font-semibold group-hover:text-accent transition-colors leading-tight min-h-[2.5rem]">
                        {coffee.nome}
                      </h3>

                      {/* Star rating */}
                      <div className="flex items-center gap-0.5 mt-2">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s < 4 ? "fill-accent text-accent" : "text-border"}`} />
                        ))}
                      </div>

                      {/* Sensory notes */}
                      {coffee.notas_sensoriais && coffee.notas_sensoriais.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {coffee.notas_sensoriais.slice(0, 2).map((nota) => (
                            <span
                              key={nota}
                              className="inline-flex items-center gap-1 text-[11px] font-body text-muted-foreground"
                            >
                              <span className="w-2 h-2 rounded-full bg-accent/60" />
                              {nota}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Price */}
                      <p className="font-body font-bold text-xl text-foreground mt-4">
                        R$ {coffee.preco.toFixed(2).replace(".", ",")}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-body mt-0.5">
                        Em até 3x de R$ {parcela.toFixed(2).replace(".", ",")} s/ juros
                      </p>

                      {/* Pix price or CTA button */}
                      <div className="mt-3 border border-accent/30 rounded-md px-3 py-2 text-center">
                        <span className="text-xs font-body font-semibold text-accent flex items-center justify-center gap-1.5">
                          <ShoppingBag className="w-3 h-3" />
                          À vista R$ {pixPrice.toFixed(2).replace(".", ",")} no Pix
                        </span>
                      </div>
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
