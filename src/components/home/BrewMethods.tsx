import { motion } from "framer-motion";
import { Coffee, Droplets, Flame, CupSoda, Bean } from "lucide-react";

const methods = [
  { name: "V60", icon: Droplets, description: "Limpo e delicado" },
  { name: "Aeropress", icon: CupSoda, description: "Corpo e intensidade" },
  { name: "Italiana", icon: Flame, description: "Forte e encorpado" },
  { name: "Coador", icon: Coffee, description: "Tradicional brasileiro" },
  { name: "French Press", icon: Bean, description: "Textura aveludada" },
];

const BrewMethods = () => {
  return (
    <section className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[11px] font-body tracking-[0.3em] uppercase text-gold">Como Preparar</span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold mt-3 text-foreground">
            Métodos de <span className="italic font-light">Preparo</span>
          </h2>
          <div className="w-16 h-px bg-gradient-to-r from-gold/0 via-gold to-gold/0 mx-auto mt-6" />
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {methods.map((method, i) => {
            const Icon = method.icon;
            return (
              <motion.div
                key={method.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group text-center p-8 rounded-lg bg-card border border-border hover:border-gold/30 transition-all duration-500 cursor-pointer"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gold/5 border border-gold/10 flex items-center justify-center group-hover:bg-gold/10 group-hover:border-gold/25 group-hover:scale-110 transition-all duration-500">
                  <Icon className="w-6 h-6 text-gold/70 group-hover:text-gold transition-colors" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{method.name}</h3>
                <p className="text-[11px] text-muted-foreground font-body mt-1">{method.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BrewMethods;
