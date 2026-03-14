import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  { name: "Maycon Mazotti", role: "Barista", text: "Café muito doce, acidez bem baixa, com corpo equilibrado. Um dos melhores cafés especiais que já provei. As notas de cacau são evidentes desde o aroma.", rating: 5, coffee: "LR Cacau" },
  { name: "Vitor Benhosi", role: "Barista", text: "Um café equilibrado, com acidez e doçura na medida certa. Perfeito para quem aprecia um café especial com personalidade e complexidade sensorial.", rating: 5, coffee: "LR MEL" },
  { name: "Alba Lopes", role: "Produtora", text: "Esta foi nossa melhor safra da história. Os grãos cultivados na altitude de 1370m em Campestre-MG resultaram em um café excepcional, com notas frutadas intensas.", rating: 5, coffee: "Fazenda da Serra" },
  { name: "Paulo Posteral", role: "Mestre de Torras", text: "Estou há quase 20 anos no mercado de cafés especiais. Cada lote é torrado com dedicação para extrair o máximo potencial sensorial de cada grão.", rating: 5, coffee: "La Régence" },
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 lg:py-32 bg-cream-100">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[11px] font-body tracking-[0.3em] uppercase text-gold">Depoimentos</span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold mt-3 text-brown-dark">
            O que dizem nossos <span className="italic font-light">clientes</span>
          </h2>
          <div className="w-16 h-px bg-gradient-to-r from-gold/0 via-gold to-gold/0 mx-auto mt-6" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card p-8 rounded-2xl border border-cream-400 relative hover:shadow-lg hover:border-gold/30 transition-all duration-500 group"
            >
              <Quote className="w-8 h-8 text-gold/10 absolute top-4 right-4 group-hover:text-gold/20 transition-colors" />
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-gold text-gold" />
                ))}
              </div>
              <p className="font-body text-brown italic leading-relaxed mb-6 text-sm">
                "{t.text}"
              </p>
              <div className="border-t border-cream-400 pt-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-xs font-body font-bold text-gold">
                  {t.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="font-body font-semibold text-sm text-brown-dark">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground font-body">{t.role} · <span className="text-gold border border-gold/30 rounded-full px-1.5 py-0.5">{t.coffee}</span></p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
