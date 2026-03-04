import { motion } from "framer-motion";
import { Coffee, Award, Heart, MapPin, Users, Leaf } from "lucide-react";
import Layout from "@/components/layout/Layout";

const TIMELINE = [
  { year: "2006", title: "O começo", desc: "Nasce a La Régence em Andradina-SP, com a missão de levar café especial ao interior paulista." },
  { year: "2010", title: "Primeira torrefação", desc: "Inauguramos nossa torrefação artesanal, controlando cada etapa do grão à xícara." },
  { year: "2014", title: "Selo SCA", desc: "Nossos cafés alcançam pontuações acima de 80 na escala SCA, consolidando a qualidade." },
  { year: "2018", title: "Expansão online", desc: "Lançamos a loja virtual para levar nossos cafés a todo o Brasil, com frete grátis." },
  { year: "2022", title: "Clube de Assinatura", desc: "Criamos o clube para enviar cafés exclusivos e surpresas mensais aos assinantes." },
  { year: "2024", title: "Novos horizontes", desc: "Parcerias com produtores premiados e cafés de microlotes de origens raras." },
];

const VALUES = [
  { icon: Leaf, title: "Sustentabilidade", desc: "Embalagens recicláveis e parcerias com produtores que respeitam o meio ambiente." },
  { icon: Award, title: "Qualidade SCA", desc: "Todos os nossos cafés possuem pontuação acima de 80 pontos na escala SCA." },
  { icon: Heart, title: "Paixão artesanal", desc: "Cada lote é torrado com cuidado, em pequenas quantidades, para garantir frescor." },
  { icon: Users, title: "Comunidade", desc: "Valorizamos produtores locais e promovemos a cultura do café especial." },
];

const SobrePage = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-espresso text-primary-foreground py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border border-gold/10" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-gold text-xs font-body tracking-[0.3em] uppercase">Nossa história</span>
            <h1 className="font-display text-4xl lg:text-6xl font-light mt-3 mb-6">
              Sobre a La <span className="italic font-medium text-gold">Régence</span>
            </h1>
            <p className="text-primary-foreground/70 font-body leading-relaxed">
              Desde 2006 em Andradina-SP, somos apaixonados por transformar grãos cuidadosamente 
              selecionados em experiências sensoriais únicas. Cada xícara conta uma história de 
              origem, dedicação e sabor.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="font-display text-2xl lg:text-3xl text-center mb-10">Nossos valores</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <v.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-display text-sm font-semibold mb-1">{v.title}</h3>
                <p className="font-body text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 lg:py-20 bg-secondary/30">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <h2 className="font-display text-2xl lg:text-3xl text-center mb-12">Nossa trajetória</h2>
          <div className="relative">
            <div className="absolute left-4 lg:left-1/2 top-0 bottom-0 w-px bg-border lg:-translate-x-px" />
            <div className="space-y-10">
              {TIMELINE.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`relative flex items-start gap-6 ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} lg:text-${i % 2 === 0 ? "right" : "left"}`}
                >
                  <div className={`hidden lg:block flex-1 ${i % 2 === 0 ? "text-right pr-8" : "text-left pl-8"}`}>
                    <span className="font-display text-3xl font-bold text-accent/30">{item.year}</span>
                    <h3 className="font-display text-base font-semibold mt-1">{item.title}</h3>
                    <p className="font-body text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                  <div className="absolute left-4 lg:left-1/2 w-3 h-3 rounded-full bg-accent border-2 border-background -translate-x-1.5 mt-1.5 z-10" />
                  <div className="flex-1 lg:hidden pl-10">
                    <span className="font-display text-2xl font-bold text-accent/30">{item.year}</span>
                    <h3 className="font-display text-base font-semibold mt-1">{item.title}</h3>
                    <p className="font-body text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                  <div className="hidden lg:block flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8 max-w-2xl text-center">
          <MapPin className="w-8 h-8 text-accent mx-auto mb-4" />
          <h2 className="font-display text-2xl font-semibold mb-3">Visite-nos</h2>
          <p className="font-body text-sm text-muted-foreground leading-relaxed mb-2">
            Nossa cafeteria e torrefação ficam em Andradina, no interior de São Paulo.
          </p>
          <p className="font-body text-sm text-muted-foreground">
            <strong className="text-foreground">Horário:</strong> Seg a Sáb, 8h às 18h
          </p>
          <p className="font-body text-sm text-muted-foreground mt-1">
            <strong className="text-foreground">Telefone:</strong>{" "}
            <a href="tel:+5518996540883" className="text-accent hover:underline">(18) 99654-0883</a>
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default SobrePage;
