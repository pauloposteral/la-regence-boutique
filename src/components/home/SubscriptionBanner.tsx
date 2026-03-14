import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const SubscriptionBanner = () => {
  return (
    <section className="py-24 lg:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-[11px] font-body tracking-[0.3em] uppercase text-gold block mb-4">
              Clube de Assinatura
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1] mb-4 text-foreground">
              Nunca fique sem{" "}
              <span className="italic font-medium text-gradient-gold block">
                o seu café preferido.
              </span>
            </h2>
            <p className="font-body text-muted-foreground text-sm leading-relaxed mb-8 max-w-md">
              Receba cafés especiais frescos, torrados sob demanda, direto na sua porta. Pausa e cancele quando quiser.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gold text-white hover:bg-gold-dark font-body text-sm tracking-[0.08em] uppercase px-8 transition-all duration-300 hover:shadow-[0_4px_20px_hsl(var(--gold)/0.3)]"
            >
              <Link to="/assinatura">
                Quero fazer parte <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative rounded-3xl overflow-hidden aspect-[4/3]">
              <img
                src="/images/torrefacao.jpeg"
                alt="Torrefação artesanal La Régence"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionBanner;
