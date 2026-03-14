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
    <section className="py-20 lg:py-28 bg-cream-200">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-[11px] font-body tracking-[0.3em] uppercase text-gold mb-4">Depoimentos</p>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-brown-dark">
            O que dizem sobre <span className="italic font-light text-gradient-gold">nossos cafés</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-card rounded-2xl p-6 border border-cream-400 relative"
            >
              <Quote className="w-6 h-6 text-gold/20 absolute top-4 right-4" />
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-gold text-gold" />
                ))}
              </div>
              <p className="font-body text-sm text-muted-foreground leading-relaxed mb-4 italic">"{t.text}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-sm font-semibold">{t.name}</p>
                  <p className="font-body text-[10px] text-muted-foreground">{t.role}</p>
                </div>
                <span className="text-[10px] font-body font-medium text-gold bg-gold/10 px-2 py-0.5 rounded-full">{t.coffee}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
