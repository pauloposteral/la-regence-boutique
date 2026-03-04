import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";

const coffees = [
  { id: 1, name: "Cerrado Mineiro", note: "Chocolate & Nozes", sca: 86, price: "R$ 49,90", image: "☕" },
  { id: 2, name: "Mogiana Paulista", note: "Caramelo & Frutas", sca: 84, price: "R$ 42,90", image: "☕" },
  { id: 3, name: "Sul de Minas", note: "Mel & Floral", sca: 88, price: "R$ 54,90", image: "☕" },
  { id: 4, name: "Alta Mogiana", note: "Frutas Vermelhas", sca: 85, price: "R$ 46,90", image: "☕" },
  { id: 5, name: "Chapada Diamantina", note: "Cítrico & Jasmin", sca: 90, price: "R$ 62,90", image: "☕" },
];

const CoffeeCarousel = () => {
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {coffees.map((coffee, i) => (
            <motion.div
              key={coffee.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/cafe/${coffee.id}`}
                className="group block bg-card rounded-lg overflow-hidden border border-border hover:border-accent/30 hover:shadow-lg transition-all duration-300"
              >
                {/* Image placeholder */}
                <div className="aspect-[3/4] bg-secondary flex items-center justify-center relative overflow-hidden">
                  <span className="text-5xl group-hover:scale-110 transition-transform duration-500">
                    {coffee.image}
                  </span>
                  {/* SCA badge */}
                  <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-body font-semibold px-2 py-1 rounded flex items-center gap-1">
                    <Star className="w-3 h-3 fill-gold text-gold" />
                    SCA {coffee.sca}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-display text-lg font-semibold">{coffee.name}</h3>
                  <p className="text-xs text-muted-foreground font-body mt-1">{coffee.note}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-body font-semibold text-foreground">{coffee.price}</span>
                    <span className="text-[10px] text-accent font-body">10% off no Pix</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoffeeCarousel;
