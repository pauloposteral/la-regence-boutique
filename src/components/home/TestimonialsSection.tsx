import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  { name: "Marina C.", text: "O melhor café que já provei. As notas de chocolate são incríveis!", rating: 5, coffee: "Cerrado Mineiro" },
  { name: "Ricardo S.", text: "Assinei o clube e não me arrependo. Cada mês é uma surpresa maravilhosa.", rating: 5, coffee: "Clube de Assinatura" },
  { name: "Juliana M.", text: "A torra perfeita. O aroma ao abrir a embalagem é uma experiência.", rating: 5, coffee: "Sul de Minas" },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 lg:py-28 bg-secondary">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-accent text-xs font-body tracking-[0.3em] uppercase">Depoimentos</span>
          <h2 className="font-display text-4xl lg:text-5xl font-light mt-3">
            O que dizem nossos <span className="italic font-medium">clientes</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card p-8 rounded-lg border border-border"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
              <p className="font-body text-foreground/80 italic leading-relaxed mb-6">
                "{t.text}"
              </p>
              <div className="border-t border-border pt-4">
                <p className="font-body font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground font-body">{t.coffee}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
