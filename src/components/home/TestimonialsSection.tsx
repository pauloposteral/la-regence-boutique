import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Maycon Mazotti",
    role: "Barista",
    text: "Café muito doce, acidez bem baixa, com corpo equilibrado. Um dos melhores cafés especiais que já provei. As notas de cacau são evidentes desde o aroma.",
    rating: 5,
    coffee: "LR Cacau",
  },
  {
    name: "Vitor Benhosi",
    role: "Barista",
    text: "Um café equilibrado, com acidez e doçura na medida certa. Perfeito para quem aprecia um café especial com personalidade e complexidade sensorial.",
    rating: 5,
    coffee: "LR MEL",
  },
  {
    name: "Alba Lopes",
    role: "Produtora",
    text: "Esta foi nossa melhor safra da história. Os grãos cultivados na altitude de 1370m em Campestre-MG resultaram em um café excepcional, com notas frutadas intensas.",
    rating: 5,
    coffee: "Fazenda da Serra",
  },
  {
    name: "Paulo Posteral",
    role: "Mestre de Torras",
    text: "Estou há quase 20 anos no mercado de cafés especiais. Cada lote é torrado com dedicação para extrair o máximo potencial sensorial de cada grão.",
    rating: 5,
    coffee: "La Régence",
  },
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card p-8 rounded-lg border border-border relative"
            >
              <Quote className="w-8 h-8 text-accent/15 absolute top-4 right-4" />
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
              <p className="font-body text-foreground/80 italic leading-relaxed mb-6 text-sm">
                "{t.text}"
              </p>
              <div className="border-t border-border pt-4">
                <p className="font-body font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground font-body">{t.role} · {t.coffee}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
