import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const products = [
  {
    name: "Café LR Geisha – 250g",
    price: 59.90,
    notes: "Anis pisto · Cítral",
    noteIcon: "🌸",
    stars: 5,
    image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&q=80",
    slug: "cafe-lr-geisha",
  },
  {
    name: "Café LR Lacana – 250g",
    price: 69.90,
    notes: "Chocolate · Orange",
    noteIcon: "🍫",
    stars: 4,
    image: "https://images.unsplash.com/photo-1610632380989-680fe40816c6?w=400&q=80",
    slug: "cafe-lr-lacana",
  },
  {
    name: "Café LR MEL – 500g",
    price: 69.90,
    notes: "Amêndoas · Drupes",
    noteIcon: "🥜",
    stars: 4,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80",
    slug: "cafe-lr-mel",
  },
  {
    name: "LR DripCoffee – CX com 10 Sachês",
    price: 69.90,
    notes: "Chocolate · Caramelo",
    noteIcon: "🍫",
    stars: 3,
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80",
    slug: "lr-dripcoffee",
  },
];

const CoffeeCarousel = () => {
  return (
    <section className="py-20 lg:py-24" style={{ backgroundColor: "hsl(var(--cream))" }}>
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-display text-3xl lg:text-[42px] font-semibold text-foreground">
            Nossos Cafés
          </h2>
          <p className="text-sm lg:text-base text-muted-foreground font-body mt-4 max-w-[600px] mx-auto leading-relaxed">
            Experimente nossos cafés especiais, com pontuação SCA acima de 80 pontos, 
            selecionados e torrados artesanalmente para uma experiência sensorial incomparável.
          </p>
          <div className="w-12 h-[2px] mx-auto mt-6" style={{ backgroundColor: "hsl(var(--gold))" }} />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, i) => {
            const pixPrice = product.price * 0.9;
            const parcela = product.price / 3;

            return (
              <motion.div
                key={product.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={`/cafe/${product.slug}`}
                  className="group block bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-border"
                >
                  {/* Image */}
                  <div className="aspect-square flex items-center justify-center p-6" style={{ backgroundColor: "hsl(var(--cream))" }}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-5">
                    {/* Name */}
                    <h3 className="font-display text-base lg:text-lg font-semibold text-foreground leading-tight min-h-[2.5rem]">
                      {product.name}
                    </h3>

                    {/* Stars */}
                    <div className="flex items-center gap-0.5 mt-2">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          className="w-3.5 h-3.5"
                          style={{
                            fill: s < product.stars ? "hsl(var(--gold))" : "transparent",
                            color: s < product.stars ? "hsl(var(--gold))" : "hsl(var(--border))",
                          }}
                        />
                      ))}
                    </div>

                    {/* Sensory notes */}
                    <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-body px-2.5 py-1 rounded-full" style={{ backgroundColor: "hsl(var(--gold) / 0.12)", color: "hsl(var(--espresso-light))" }}>
                      <span>{product.noteIcon}</span>
                      {product.notes}
                    </div>

                    {/* Price */}
                    <p className="font-body font-bold text-xl text-foreground mt-4">
                      R$ {product.price.toFixed(2).replace(".", ",")}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-body mt-0.5">
                      Em até 3x de R$ {parcela.toFixed(2).replace(".", ",")} s/ juros
                    </p>

                    {/* Pix badge */}
                    <div className="mt-3 rounded px-3 py-2 text-center text-xs font-body font-semibold text-white" style={{ backgroundColor: "hsl(var(--pix-green))" }}>
                      ✦ À vista R$ {pixPrice.toFixed(2).replace(".", ",")} no Pix
                    </div>

                    {/* CTA */}
                    <Button
                      size="sm"
                      className="w-full mt-3 bg-primary text-primary-foreground hover:opacity-90 font-body text-xs tracking-wide rounded"
                    >
                      Escolher moagem
                    </Button>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CoffeeCarousel;
