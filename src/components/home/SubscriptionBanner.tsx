import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const SubscriptionBanner = () => {
  return (
    <section className="py-20 lg:py-28 bg-gradient-espresso text-primary-foreground relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border border-gold/10" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full border border-gold/5" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold text-xs font-body tracking-[0.3em] uppercase">Clube de Assinatura</span>
            <h2 className="font-display text-4xl lg:text-5xl font-light mt-3 mb-6 leading-tight">
              Nunca fique sem o seu{" "}
              <span className="italic font-medium text-gold">café preferido.</span>
            </h2>
            <p className="text-primary-foreground/70 font-body leading-relaxed mb-8 max-w-lg">
              Receba cafés especiais selecionados pela nossa equipe todos os meses, 
              com descontos exclusivos e a comodidade de receber em casa.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-sm tracking-wide px-8"
            >
              <Link to="/assinatura">
                Quero fazer parte <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>

            <div className="flex items-center gap-8 mt-10 text-sm font-body text-primary-foreground/50">
              <span>A partir de R$ 39,90/mês</span>
              <span className="w-px h-4 bg-primary-foreground/20" />
              <span>Cancele quando quiser</span>
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="hidden lg:block"
          >
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] border border-gold/10">
              <img
                src="/images/torrefacao.jpeg"
                alt="Torrefação artesanal La Régence"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionBanner;
