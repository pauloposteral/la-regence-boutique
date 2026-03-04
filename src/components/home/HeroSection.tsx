import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1400&q=80')` }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(45,10,10,0.88), rgba(45,10,10,0.35))" }} />

      <div className="container mx-auto px-4 lg:px-[8%] relative z-10">
        <div className="max-w-xl">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-block text-[11px] font-body tracking-[0.3em] uppercase mb-5"
            style={{ color: "hsl(var(--gold))" }}
          >
            Torrefação Artesanal · Andradina-SP
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="font-display text-[40px] sm:text-[52px] lg:text-[64px] font-semibold leading-[1.15] mb-6 text-white"
          >
            Cada xícara, uma<br />experiência sensorial
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-base lg:text-lg font-body font-light max-w-[480px] mb-8 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.8)" }}
          >
            Cafés especiais acima de 80 pontos, torrados artesanalmente 
            em Andradina-SP para revelar cada nota de sabor do grão.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-row gap-3"
          >
            <Button
              asChild
              size="lg"
              className="font-body text-sm font-semibold tracking-wide px-7 py-3.5 rounded"
              style={{ backgroundColor: "hsl(var(--gold))", color: "hsl(var(--primary))" }}
            >
              <Link to="/cafes">Explorar Cafés</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="font-body text-sm font-semibold tracking-wide px-7 py-3.5 rounded bg-transparent hover:bg-white hover:text-foreground"
              style={{ border: "2px solid white", color: "white" }}
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
