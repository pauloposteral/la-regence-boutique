import { motion } from "framer-motion";
import { Coffee, Users, Flame, Award } from "lucide-react";

const stats = [
  { icon: Flame, value: "+7.000", label: "dias torrando café" },
  { icon: Users, value: "+7.000", label: "nossos clientes\nsatisfeitos" },
  { icon: Coffee, value: "", label: "Torrefação própria\nprópria", isIcon: true },
  { icon: Award, value: "+X mil", label: "clientes atendidos" },
];

const StatsSection = () => {
  return (
    <section className="py-16 lg:py-24 bg-gradient-cream">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              {stat.isIcon ? (
                <stat.icon className="w-12 h-12 mx-auto mb-2 text-accent" />
              ) : (
                <p className="font-display text-3xl lg:text-4xl font-bold text-foreground">
                  {stat.value}
                </p>
              )}
              <p className="text-sm font-body text-muted-foreground mt-2 whitespace-pre-line leading-snug">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
