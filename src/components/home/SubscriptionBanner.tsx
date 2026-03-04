import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const SubscriptionBanner = () => {
  return (
    <section className="py-20 lg:py-28" style={{ backgroundColor: "hsl(var(--cream))" }}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-[10px] font-body tracking-[0.35em] uppercase block mb-4" style={{ color: "hsl(var(--gold))" }}>
              Vantagem por Assinantes
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-[48px] font-semibold leading-[1.15] mb-8 text-foreground">
              Nunca fique sem<br />
              o seu café preferido.
            </h2>
            <Button
              asChild
              size="lg"
              className="font-body text-sm font-semibold tracking-wide px-8 py-4 rounded"
              style={{ backgroundColor: "hsl(var(--gold))", color: "hsl(var(--primary))" }}
            >
              <Link to="/assinatura">
                Quero fazer parte <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="rounded-xl overflow-hidden" style={{ height: "400px" }}>
              <img
                src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600&q=80"
                alt="Café especial La Régence"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionBanner;
