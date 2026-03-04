import { motion } from "framer-motion";
import { Coffee, Users, Flame, Award } from "lucide-react";

const stats = [
  { icon: Flame, value: "+7.000", label: "dias torrando café", suffix: "" },
  { icon: Users, value: "+5 mil", label: "clientes atendidos", suffix: "" },
  { icon: Coffee, value: "100%", label: "torrefação própria", suffix: "" },
  { icon: Award, value: "SCA 80+", label: "pontuação mínima", suffix: "" },
];

const StatsSection = () => {
  return (
    <section className="py-16 lg:py-24 bg-gradient-cream">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <stat.icon className="w-8 h-8 mx-auto mb-3 text-accent" />
              <p className="font-display text-3xl lg:text-4xl font-semibold text-foreground">
                {stat.value}
              </p>
              <p className="text-sm font-body text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
