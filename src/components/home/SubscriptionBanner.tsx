import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const SubscriptionBanner = () => {
  return (
    <section className="py-20 lg:py-28 bg-gradient-espresso text-primary-foreground relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold text-[10px] font-body tracking-[0.35em] uppercase block mb-4">
              Velarp Pet Assinatura/Club
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light leading-[1.15] mb-8">
              Nunca fique sem<br />
              o seu café preferido.
            </h2>
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-sm tracking-wide px-8 rounded-md"
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
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-gold/10">
              <img
                src="/images/torrefacao.jpeg"
                alt="Torrefação artesanal La Régence"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionBanner;
