import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-[85vh] lg:min-h-[90vh] flex items-center overflow-hidden">
      {/* Parallax background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat parallax-bg scale-105"
        style={{ backgroundImage: `url('/images/torrefacao.jpeg')` }}
      />
      {/* Dark overlay — cinematic gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/98 via-background/90 to-background/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />

      {/* Subtle gold vignette */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="flex flex-col items-start text-left max-w-2xl">
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[11px] font-body tracking-[0.3em] uppercase text-gold mb-6"
          >
            Torrefação artesanal · Desde 2006
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.05] mb-6 text-foreground"
          >
            Cada xícara,{" "}
            <span className="block italic font-medium text-gradient-gold">
              uma experiência
            </span>
            <span className="block font-accent text-3xl sm:text-4xl lg:text-5xl font-light text-foreground/70 mt-2">
              sensorial única
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="w-20 h-px bg-gradient-to-r from-gold to-gold-light mb-6 origin-left"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm sm:text-base font-body font-light max-w-md mb-10 leading-relaxed text-muted-foreground"
          >
            Cafés especiais acima de 80 pontos SCA, torrados 
            artesanalmente em Andradina-SP para revelar 
            cada nota de sabor do grão.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="flex flex-row gap-4"
          >
            <Button
              asChild
              size="lg"
              className="bg-gold text-primary-foreground hover:bg-gold-light font-body text-sm tracking-[0.08em] uppercase px-8 rounded-none transition-all duration-300 hover:shadow-[0_4px_20px_hsl(var(--gold)/0.3)]"
            >
              <Link to="/cafes">
                Explorar Cafés
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="font-body text-sm tracking-[0.08em] uppercase px-8 rounded-none border-gold/30 text-foreground hover:bg-gold/10 hover:border-gold/60 transition-all duration-300"
            >
              <Link to="/assinatura">Clube de Assinatura</Link>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] font-body tracking-[0.2em] uppercase text-muted-foreground">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-px h-8 bg-gradient-to-b from-gold/50 to-transparent"
        />
      </motion.div>
    </section>
  );
};

export default HeroSection;
