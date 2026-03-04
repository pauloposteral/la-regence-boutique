import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-[85vh] lg:min-h-[90vh] flex items-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/images/torrefacao.jpeg')` }}
      />
      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-espresso/95 via-espresso/80 to-espresso/60" />
      {/* Subtle texture */}
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left max-w-3xl">
          {/* Logo */}
          <motion.img
            src="/images/logo-laregence.jpeg"
            alt="La Régence"
            className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-2xl object-cover shadow-2xl mb-8 border-2 border-gold/30"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          />

          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-block text-gold text-xs sm:text-sm font-body tracking-[0.3em] uppercase mb-4"
          >
            Torrefação Artesanal · Desde 2006
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-[1.1] mb-6 text-cream"
          >
            Cada xícara,{" "}
            <span className="italic font-medium text-gold">
              uma experiência
            </span>{" "}
            sensorial
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-base sm:text-lg text-cream/70 font-body font-light max-w-lg mb-8 leading-relaxed"
          >
            Cafés especiais com pontuação SCA acima de 80 pontos, 
            torrados artesanalmente em Andradina-SP para revelar 
            cada nota de sabor do grão.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-sm tracking-wide px-8"
            >
              <Link to="/cafes">
                Explorar Cafés <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-gold/50 text-gold hover:bg-gold/10 hover:border-gold font-body text-sm tracking-wide"
            >
              <Link to="/assinatura">Clube de Assinatura</Link>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Gold accent corners */}
      <div className="absolute top-6 right-6 w-20 h-20 border-t-2 border-r-2 border-gold/20 rounded-tr-2xl hidden lg:block" />
      <div className="absolute bottom-6 left-6 w-20 h-20 border-b-2 border-l-2 border-gold/20 rounded-bl-2xl hidden lg:block" />
    </section>
  );
};

export default HeroSection;
