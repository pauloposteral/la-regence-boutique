import { motion } from "framer-motion";

const StorySection = () => {
  return (
    <section className="py-20 lg:py-28 bg-cream-100">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="aspect-[4/5] rounded-2xl overflow-hidden relative">
              <img
                src="/images/torrefacao.jpeg"
                alt="Torrefação artesanal La Régence"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-4">
                  <p className="font-display text-3xl font-bold text-brown-dark">+18</p>
                  <p className="font-body text-xs text-brown uppercase tracking-wider">anos de tradição</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-6"
          >
            <p className="text-[11px] font-body tracking-[0.3em] uppercase text-gold">Nossa História</p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight text-brown-dark">
              Do grão à xícara,{" "}
              <span className="italic font-light text-gradient-gold">com paixão</span>
            </h2>
            <div className="w-16 h-px bg-gradient-to-r from-gold to-gold-light" />
            <p className="font-body text-brown leading-relaxed">
              Desde 2005, a La Régence seleciona os melhores grãos de cafés especiais do Brasil.
              Nossa torrefação artesanal em Andradina-SP transforma cada lote em uma experiência
              sensorial única, respeitando o perfil de cada origem.
            </p>
            <p className="font-body text-brown leading-relaxed">
              Trabalhamos diretamente com produtores que compartilham nossa visão de qualidade,
              sustentabilidade e rastreabilidade do grão à xícara.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[
                { value: "SCA 80+", label: "Pontuação mínima" },
                { value: "100%", label: "Rastreável" },
                { value: "Artesanal", label: "Torrefação" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="font-display text-lg font-bold text-gold">{item.value}</p>
                  <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
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
