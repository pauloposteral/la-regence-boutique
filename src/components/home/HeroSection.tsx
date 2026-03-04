import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-espresso">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-primary-foreground"
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-block text-gold text-sm font-body tracking-[0.3em] uppercase mb-4"
            >
              Torrefação Artesanal · Desde 2006
            </motion.span>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-light leading-[1.1] mb-6">
              Cada xícara,{" "}
              <span className="italic font-medium text-gold">
                uma experiência
              </span>{" "}
              sensorial
            </h1>

            <p className="text-lg text-primary-foreground/70 font-body font-light max-w-lg mb-8 leading-relaxed">
              Cafés especiais com pontuação SCA acima de 80 pontos, 
              torrados artesanalmente em Andradina-SP para revelar 
              cada nota de sabor do grão.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
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
            </div>
          </motion.div>

          {/* Hero image placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="hidden lg:flex justify-center"
          >
            <div className="relative w-[420px] h-[520px] rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-mocha/50 to-espresso/80 flex items-center justify-center">
                <div className="text-center text-primary-foreground/40">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full border-2 border-gold/30 flex items-center justify-center">
                    <span className="font-display text-5xl text-gold/50">☕</span>
                  </div>
                  <p className="font-body text-sm">Imagem do produto destaque</p>
                </div>
              </div>
              {/* Gold accent corner */}
              <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-gold/40 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-gold/40 rounded-bl-2xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
