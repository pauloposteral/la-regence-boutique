import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const SubscriptionBanner = () => {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-cream-200" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C4A265' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-[11px] font-body tracking-[0.3em] uppercase text-gold block mb-4">
              Clube de Assinatura
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1] mb-4 text-brown-dark">
              Nunca fique sem{" "}
              <span className="italic font-medium text-gradient-gold block">
                o seu café preferido.
              </span>
            </h2>
            <p className="font-body text-brown text-sm leading-relaxed mb-8 max-w-md">
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
            <div className="relative rounded-xl overflow-hidden aspect-[4/3] border border-gold/15 glow-gold">
              <img
                src="/images/torrefacao.jpeg"
                alt="Torrefação artesanal La Régence"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brown-deep/40 to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionBanner;
