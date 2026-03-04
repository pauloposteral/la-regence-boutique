import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const SubscriptionBanner = () => {
  return (
    <section className="py-20 lg:py-28 bg-gradient-espresso text-primary-foreground relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border border-gold/10" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full border border-gold/5" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold text-xs font-body tracking-[0.3em] uppercase">Exclusivo</span>
            <h2 className="font-display text-4xl lg:text-5xl font-light mt-3 mb-6">
              Clube de{" "}
              <span className="italic font-medium text-gold">Assinatura</span>
            </h2>
            <p className="text-primary-foreground/70 font-body leading-relaxed mb-8 max-w-lg mx-auto">
              Receba cafés especiais selecionados pela nossa equipe todos os meses, 
              com descontos exclusivos e a comodidade de receber em casa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-sm tracking-wide px-8"
              >
                <Link to="/assinatura">
                  Assinar Agora <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 mt-10 text-sm font-body text-primary-foreground/50">
              <span>A partir de R$ 39,90/mês</span>
              <span className="w-px h-4 bg-primary-foreground/20" />
              <span>Cancele quando quiser</span>
              <span className="w-px h-4 bg-primary-foreground/20 hidden sm:block" />
              <span className="hidden sm:inline">Frete grátis</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionBanner;
