import { motion } from "framer-motion";
import { Coffee, Users, Flame, Award } from "lucide-react";

const stats = [
  { icon: Flame, value: "+7.000", label: "dias torrando café" },
  { icon: Users, value: "+7.000", label: "clientes satisfeitos" },
  { icon: Coffee, value: "Própria", label: "Torrefação artesanal" },
  { icon: Award, value: "SCA 80+", label: "Pontuação mínima" },
];

const StatsSection = () => {
  return (
    <section className="py-16 bg-brown-dark text-cream-100">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <stat.icon className="w-8 h-8 text-gold mx-auto mb-3" />
              <p className="font-display text-3xl lg:text-4xl font-bold text-gold-light">{stat.value}</p>
              <p className="font-body text-xs text-cream-500 mt-1 uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
