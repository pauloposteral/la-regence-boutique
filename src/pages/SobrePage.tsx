import { motion } from "framer-motion";
import { Coffee, Award, Heart, MapPin, Users, Leaf, Search, Flame, Package, Truck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";

const TIMELINE = [
  { year: "2005", title: "O começo", desc: "A família Posteral, apaixonada por cafés, funda a Cafe La Regence na Av. Guanabara, 2919 — Stella Maris, Andradina-SP." },
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

const PROCESS_STEPS = [
  { icon: Search, title: "Seleção", desc: "Grãos selecionados de fazendas parceiras com score SCA acima de 80 pontos." },
  { icon: Flame, title: "Torra", desc: "Torrefação artesanal sob demanda — seu café é torrado após o pedido para máximo frescor." },
  { icon: Package, title: "Empacotamento", desc: "Embalagem a vácuo com válvula degasificadora, preservando aroma e sabor." },
  { icon: Truck, title: "Entrega", desc: "Enviado em até 48h após a torra. Café fresco direto para a sua casa." },
];

const PRODUCERS = [
  { name: "Fazenda Santuário Sul", region: "Carmo de Minas, MG", country: "Brasil", image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop", specialty: "Bourbon Amarelo, SCA 87" },
  { name: "Finca El Paraíso", region: "Huila", country: "Colômbia", image: "https://images.unsplash.com/photo-1524350876685-274059332603?w=400&h=300&fit=crop", specialty: "Geisha, SCA 89" },
  { name: "Fazenda Cachoeira", region: "Campestre, MG", country: "Brasil", image: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=400&h=300&fit=crop", specialty: "Catuaí Vermelho, SCA 84" },
];

const SobrePage = () => {
  return (
    <Layout>
      <SEOHead
        title="Nossa História"
        description="Conheça a La Régence: cafeteria e torrefação artesanal de cafés especiais desde 2005 em Andradina-SP. Qualidade SCA, frescor e paixão em cada xícara."
        url="https://lojalaregence.lovable.app/sobre"
      />

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
                A história do Café La Régence começou em 2005, na cidade de Andradina, interior de São Paulo, 
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

      {/* Process Timeline */}
      <section className="py-16 lg:py-20 bg-gold/5 border-y border-gold/10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-gold text-xs font-body tracking-[0.3em] uppercase">Do grão à xícara</span>
            <h2 className="font-display text-2xl lg:text-3xl mt-2">Nosso processo</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {PROCESS_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="text-center relative"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background border-2 border-gold/30 flex items-center justify-center">
                  <step.icon className="w-7 h-7 text-gold" />
                </div>
                {i < PROCESS_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gold/20" />
                )}
                <span className="font-body text-[10px] tracking-[0.2em] uppercase text-gold mb-1 block">Etapa {i + 1}</span>
                <h3 className="font-display text-base font-semibold mb-1">{step.title}</h3>
                <p className="font-body text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
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

      {/* Partner Producers */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-gold text-xs font-body tracking-[0.3em] uppercase">Origem rastreável</span>
            <h2 className="font-display text-2xl lg:text-3xl mt-2">Produtores parceiros</h2>
            <p className="font-body text-sm text-muted-foreground mt-3 max-w-lg mx-auto">
              Trabalhamos diretamente com produtores que compartilham nossa paixão por cafés excepcionais.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PRODUCERS.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-xl overflow-hidden group"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-base font-semibold">{p.name}</h3>
                  <p className="font-body text-xs text-muted-foreground mt-1">{p.region} · {p.country}</p>
                  <p className="font-body text-xs text-gold mt-2">{p.specialty}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-16 lg:py-20 bg-secondary/30">
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

      {/* CTA Final */}
      <section className="py-20 lg:py-28 bg-brown-deep text-cream-100 text-center">
        <div className="container mx-auto px-4 lg:px-8 max-w-xl">
          <Coffee className="w-10 h-10 text-gold mx-auto mb-4" />
          <h2 className="font-display text-3xl lg:text-4xl font-light mb-4">
            Experimente a <span className="italic font-medium text-gold">diferença</span>
          </h2>
          <p className="font-body text-sm text-cream-400 mb-8 leading-relaxed">
            Descubra cafés especiais torrados sob demanda com frescor garantido. Do grão à sua xícara em até 48 horas.
          </p>
          <Button asChild className="bg-gold text-primary-foreground hover:bg-gold-light rounded-full font-body text-sm tracking-[0.15em] uppercase px-8">
            <Link to="/cafes">
              Explorar Cafés <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default SobrePage;
