import { motion } from "framer-motion";
import { Coffee } from "lucide-react";

const stats = [
  { value: "+7.000", label: "dias carregando café" },
  { value: "+7.000", label: "assinantes no nosso projeto" },
  { value: "", label: "Torrefação própria\nAndradina", isIcon: true },
  { value: "+X mil", label: "clientes satisfeitos" },
];

const StatsSection = () => {
  return (
    <section className="py-16 lg:py-24" style={{ backgroundColor: "hsl(var(--espresso))" }}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center relative"
            >
              {/* Divider */}
              {i > 0 && (
                <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-12" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
              )}

              {stat.isIcon ? (
                <Coffee className="w-12 h-12 mx-auto mb-3" style={{ color: "hsl(var(--gold))" }} />
              ) : (
                <p className="font-display text-4xl lg:text-[52px] font-bold" style={{ color: "hsl(var(--gold))" }}>
                  {stat.value}
                </p>
              )}
              <p className="text-xs font-body uppercase tracking-[0.1em] mt-3 whitespace-pre-line leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
