import { motion } from "framer-motion";

const methods = [
  { name: "V60", icon: "☕", description: "Limpo e delicado" },
  { name: "Aeropress", icon: "🫖", description: "Corpo e intensidade" },
  { name: "Italiana", icon: "♨️", description: "Forte e encorpado" },
  { name: "Coador", icon: "☕", description: "Tradicional brasileiro" },
  { name: "French Press", icon: "🍵", description: "Textura aveludada" },
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
          {methods.map((method, i) => (
            <motion.div
              key={method.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group text-center p-6 rounded-lg bg-card border border-border hover:border-accent/30 hover:shadow-md transition-all cursor-pointer"
            >
              <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform">
                {method.icon}
              </span>
              <h3 className="font-display text-lg font-semibold">{method.name}</h3>
              <p className="text-xs text-muted-foreground font-body mt-1">{method.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrewMethods;
