import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-[80vh] lg:min-h-[85vh] flex items-center overflow-hidden">
      {/* Parallax background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat parallax-bg"
        style={{ backgroundImage: `url('/images/torrefacao.jpeg')` }}
      />
      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-espresso/95 via-espresso/85 to-espresso/50" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="flex flex-col items-start text-left max-w-xl">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-light leading-[1.1] mb-6"
            style={{ color: "hsl(var(--cream))" }}
          >
            Cada xícara, uma{" "}
            <span className="italic font-medium block" style={{ color: "hsl(var(--cream))" }}>
              experiência sensorial
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm sm:text-base font-body font-light max-w-md mb-8 leading-relaxed"
            style={{ color: "hsl(var(--cream) / 0.7)" }}
          >
            Cafés especiais acima de 80 pontos, torrados 
            artesanalmente em Andradina-SP para revelar 
            cada nota de sabor do grão.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-row gap-3"
          >
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-sm tracking-wide px-6 rounded-md"
            >
              <Link to="/cafes">
                Explorar Cafés
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="font-body text-sm tracking-wide px-6 rounded-md"
              style={{ 
                borderColor: "hsl(var(--gold) / 0.5)", 
                color: "hsl(var(--cream))" 
              }}
            >
              <Link to="/assinatura">Clube de Assinatura</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
