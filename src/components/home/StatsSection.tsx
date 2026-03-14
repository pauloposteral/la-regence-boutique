import { motion } from "framer-motion";
import { Coffee, Users, Flame, Award } from "lucide-react";

const stats = [
  { icon: Flame, value: "+7.000", label: "dias torrando café" },
  { icon: Users, value: "+7.000", label: "clientes\nsatisfeitos" },
  { icon: Coffee, value: "", label: "Torrefação\nprópria", isIcon: true },
  { icon: Award, value: "+X mil", label: "clientes\natendidos" },
];

const StatsSection = () => {
  return (
    <section className="py-20 lg:py-28 bg-white">
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
                <stat.icon className="w-12 h-12 mx-auto mb-2 text-gold" />
              ) : (
                <p className="font-display text-3xl lg:text-4xl font-bold text-gold">
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
