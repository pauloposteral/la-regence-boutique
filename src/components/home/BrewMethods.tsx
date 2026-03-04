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
    <section className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-accent text-xs font-body tracking-[0.3em] uppercase">Como Preparar</span>
          <h2 className="font-display text-4xl lg:text-5xl font-light mt-3">
            Métodos de <span className="italic font-medium">Preparo</span>
          </h2>
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
                className="group text-center p-6 rounded-lg bg-card border border-border hover:border-gold/40 hover:shadow-[0_4px_20px_-8px_hsl(var(--gold)/0.25)] transition-all cursor-pointer"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-gold/15 group-hover:scale-110 transition-all">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-display text-lg font-semibold">{method.name}</h3>
                <p className="text-xs text-muted-foreground font-body mt-1">{method.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BrewMethods;
