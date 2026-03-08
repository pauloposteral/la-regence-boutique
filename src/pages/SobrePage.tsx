import { motion } from "framer-motion";
import { Coffee, Award, Heart, MapPin, Users, Leaf } from "lucide-react";
import Layout from "@/components/layout/Layout";

const TIMELINE = [
  { year: "2006", title: "O começo", desc: "A família Posteral, apaixonada por cafés, funda uma cafeteria especializada em cafés especiais em Andradina-SP." },
  { year: "2010", title: "Primeira torrefação", desc: "Inauguramos nossa torrefação artesanal, controlando cada etapa do grão à xícara." },
  { year: "2014", title: "Selo SCA", desc: "Nossos cafés alcançam pontuações acima de 80 na escala SCA, consolidando a qualidade." },
  { year: "2018", title: "Expansão online", desc: "Lançamos a loja virtual para levar nossos cafés a todo o Brasil." },
  { year: "2022", title: "Clube de Assinatura", desc: "Criamos o clube para enviar cafés exclusivos e surpresas mensais aos assinantes." },
  { year: "2024", title: "Novos horizontes", desc: "Parcerias com produtores premiados como a Fazenda Santuário Sul em Carmo de Minas e microlotes de origens raras como o Geisha." },
];

const VALUES = [
  { icon: Leaf, title: "Sustentabilidade", desc: "Trabalhamos em parceria com produtores locais que seguem práticas agrícolas sustentáveis e garantem remuneração justa." },
  { icon: Award, title: "Qualidade SCA", desc: "Cafés com pontuação acima de 80 pontos na escala SCA. Nosso Geisha alcança 89 pontos." },
  { icon: Heart, title: "Paixão artesanal", desc: "Cada lote é torrado com cuidado pelo mestre Paulo Posteral, com quase 20 anos de experiência." },
  { icon: Users, title: "Comércio justo", desc: "Valorizamos produtores locais de Campestre-MG e Carmo de Minas, promovendo a cultura do café especial." },
];

const SobrePage = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-background border-b border-border py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border border-gold/10" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10 max-w-4xl">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="text-gold text-xs font-body tracking-[0.3em] uppercase">Nossa história</span>
              <h1 className="font-display text-4xl lg:text-5xl font-light mt-3 mb-6 text-foreground">
                Sobre a La <span className="italic font-medium text-gradient-gold">Régence</span>
              </h1>
              <p className="text-muted-foreground font-body leading-relaxed mb-4">
                A história do Café La Régence começou em 2006, na cidade de Andradina, interior de São Paulo, 
                quando a família <strong className="text-foreground">Posteral</strong>, apaixonada por cafés, 
                decidiu fundar uma cafeteria especializada em cafés especiais.
              </p>
              <p className="text-muted-foreground font-body leading-relaxed">
                Com foco em qualidade e excelência, investimos constantemente em equipamentos de última geração 
                e na capacitação de nossa equipe, visando sempre aprimorar a qualidade dos produtos e serviços. 
                Nosso objetivo é difundir a cultura do café especial no Brasil.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl overflow-hidden"
            >
              <img
                src="https://i0.wp.com/loja.cafelaregence.com.br/wp-content/uploads/2024/02/lrcacau.jpeg"
                alt="Café La Régence - Família Posteral"
                className="w-full h-72 lg:h-80 object-cover"
                loading="lazy"
              />
            </motion.div>
          </div>
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
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                  <v.icon className="w-6 h-6 text-gold" />
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
                    <span className="font-display text-3xl font-bold text-gold/30">{item.year}</span>
                    <h3 className="font-display text-base font-semibold mt-1">{item.title}</h3>
                    <p className="font-body text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                  <div className="absolute left-4 lg:left-1/2 w-3 h-3 rounded-full bg-gold border-2 border-background -translate-x-1.5 mt-1.5 z-10" />
                  <div className="flex-1 lg:hidden pl-10">
                    <span className="font-display text-2xl font-bold text-gold/30">{item.year}</span>
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
          <MapPin className="w-8 h-8 text-gold mx-auto mb-4" />
          <h2 className="font-display text-2xl font-semibold mb-3">Visite-nos</h2>
          <p className="font-body text-sm text-muted-foreground leading-relaxed mb-2">
            Nossa cafeteria e torrefação ficam em Andradina, no interior de São Paulo.
          </p>
          <p className="font-body text-sm text-muted-foreground">
            <strong className="text-foreground">Horário:</strong> Seg a Sáb, 8h às 18h
          </p>
          <p className="font-body text-sm text-muted-foreground mt-1">
            <strong className="text-foreground">Telefone:</strong>{" "}
            <a href="tel:+5518996540883" className="text-gold hover:underline">(18) 99654-0883</a>
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default SobrePage;
