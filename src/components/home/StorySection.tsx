import { motion } from "framer-motion";

const StorySection = () => {
  return (
    <section className="py-24 lg:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image with gold accent */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -left-3 top-8 bottom-8 w-px bg-gradient-to-b from-gold/0 via-gold/40 to-gold/0 hidden lg:block" />
            <img
              src="/images/torrefacao.jpeg"
              alt="Torrefação La Régence em Andradina-SP"
              className="aspect-[4/5] w-full object-cover rounded-lg border border-border"
              loading="lazy"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-[11px] font-body tracking-[0.3em] uppercase text-gold">Nossa História</span>
            <h2 className="font-display text-4xl lg:text-5xl font-bold mt-3 mb-6 text-foreground">
              A Experiência{" "}
              <span className="italic font-light text-gradient-gold">La Régence</span>
            </h2>
            <div className="space-y-4 text-muted-foreground font-body leading-relaxed text-sm">
              <p>
                Desde 2006, em Andradina-SP, a La Régence dedica-se à arte de 
                torrar cafés especiais. Cada lote é cuidadosamente selecionado 
                de fazendas com altitude acima de 900 metros.
              </p>
              <p>
                Nossa torrefação artesanal preserva as características únicas 
                de cada grão, revelando notas sensoriais complexas que 
                transformam cada xícara em uma experiência memorável.
              </p>
              <p>
                Com pontuações SCA acima de 80 pontos, nossos cafés representam 
                o que há de melhor na cafeicultura brasileira — do grão à xícara, 
                com respeito à origem e ao produtor.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-10 pt-8 border-t border-border">
              {[
                { number: "18+", label: "Anos de experiência" },
                { number: "80+", label: "Pontuação SCA mínima" },
                { number: "100%", label: "Cafés especiais" },
              ].map((stat) => (
                <div key={stat.label}>
                  <span className="font-display text-3xl font-bold text-gradient-gold">{stat.number}</span>
                  <p className="text-[11px] text-muted-foreground font-body mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default StorySection;
