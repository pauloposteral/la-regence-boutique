import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ_SECTIONS = [
  {
    title: "Pedidos & Pagamentos",
    items: [
      { q: "Quais formas de pagamento são aceitas?", a: "Aceitamos cartão de crédito (Visa, Mastercard, Amex) e Pix. Pagamentos via Pix têm 10% de desconto." },
      { q: "Posso parcelar minha compra?", a: "Sim! Parcelamos em até 12x sem juros no cartão de crédito." },
      { q: "Como aplico um cupom de desconto?", a: "No carrinho de compras, insira o código do cupom no campo 'Cupom de desconto' e clique em 'Aplicar'." },
      { q: "Posso cancelar um pedido?", a: "Pedidos podem ser cancelados enquanto o status for 'Pendente' ou 'Confirmado'. Entre em contato pelo WhatsApp ou e-mail." },
    ],
  },
  {
    title: "Entrega & Frete",
    items: [
      { q: "Qual o prazo de entrega?", a: "O prazo padrão é de 5 a 10 dias úteis. O envio expresso é de 2 a 4 dias úteis." },
      { q: "O frete é grátis?", a: "Sim! Frete grátis para compras acima de R$ 150,00 em todo o Brasil." },
      { q: "Como rastrear meu pedido?", a: "Após o envio, você receberá o código de rastreamento por e-mail. Também pode acompanhar na página 'Minha Conta'." },
      { q: "Vocês entregam em todo o Brasil?", a: "Sim, entregamos em todo o território nacional via transportadoras parceiras." },
    ],
  },
  {
    title: "Produtos & Café",
    items: [
      { q: "Os cafés são torrados na hora?", a: "Sim! Torramos artesanalmente sob demanda, garantindo frescor máximo. Cada lote é torrado após a confirmação do pedido." },
      { q: "Qual a diferença entre as moagens?", a: "Grãos: para moer na hora. Grossa: prensa francesa. Média: filtro e Aeropress. Fina: espresso e moka. Extra fina: café turco." },
      { q: "O que é a pontuação SCA?", a: "A SCA (Specialty Coffee Association) avalia cafés de 0 a 100. Cafés com 80+ são considerados 'especiais'. Nossos cafés têm pontuação 82 a 92." },
      { q: "Como armazenar o café corretamente?", a: "Guarde em recipiente hermético, em local fresco e seco, longe da luz solar. Evite a geladeira. Consuma em até 30 dias após abrir." },
    ],
  },
  {
    title: "Assinaturas",
    items: [
      { q: "Como funciona a assinatura?", a: "Escolha um plano (mensal, trimestral ou semestral), selecione a moagem e receba cafés especiais na sua porta com frete grátis." },
      { q: "Posso pausar ou cancelar minha assinatura?", a: "Sim! Você pode pausar ou cancelar a qualquer momento pela página 'Minha Conta', sem taxas adicionais." },
      { q: "O café da assinatura é surpresa?", a: "Você pode escolher receber um café específico ou ativar o 'Café Surpresa' para receber seleções exclusivas do nosso curador." },
    ],
  },
  {
    title: "Trocas & Devoluções",
    items: [
      { q: "Posso devolver um produto?", a: "Sim, em até 7 dias após o recebimento, desde que o produto esteja lacrado e em sua embalagem original." },
      { q: "E se o produto chegar danificado?", a: "Entre em contato imediatamente pelo WhatsApp ou e-mail com fotos do produto. Enviaremos um novo sem custo." },
      { q: "Como solicitar uma troca?", a: "Acesse 'Minha Conta', localize o pedido e clique em 'Solicitar Troca', ou entre em contato pelo nosso suporte." },
    ],
  },
];

const FAQPage = () => {
  return (
    <Layout>
      <SEOHead title="Perguntas Frequentes" description="Tire suas dúvidas sobre pedidos, entregas, cafés especiais, assinaturas e devoluções na La Régence." />

      <section className="bg-background border-b border-border py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <span className="text-gold text-xs font-body tracking-[0.3em] uppercase">Ajuda</span>
          <h1 className="font-display text-3xl lg:text-5xl font-light mt-3 text-foreground">
            Perguntas <span className="italic font-medium text-gradient-gold">Frequentes</span>
          </h1>
          <p className="text-muted-foreground font-body text-sm mt-4 max-w-lg mx-auto">
            Tudo que você precisa saber sobre nossos cafés, pedidos e entregas.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Início</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>FAQ</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-10">
            {FAQ_SECTIONS.map((section) => (
              <div key={section.title}>
                <h2 className="font-display text-xl font-semibold mb-4">{section.title}</h2>
                <Accordion type="single" collapsible className="border border-border rounded-xl overflow-hidden">
                  {section.items.map((item, i) => (
                    <AccordionItem key={i} value={`${section.title}-${i}`} className="border-border">
                      <AccordionTrigger className="px-5 py-4 font-body text-sm font-medium hover:text-gold transition-colors [&[data-state=open]]:text-gold">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="px-5 pb-4 font-body text-sm text-muted-foreground leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center bg-card border border-border rounded-xl p-8">
            <h3 className="font-display text-lg font-semibold mb-2">Ainda tem dúvidas?</h3>
            <p className="font-body text-sm text-muted-foreground mb-4">
              Nossa equipe está pronta para ajudar você.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/contato"
                className="inline-flex items-center justify-center bg-gold text-white rounded-full px-6 py-2.5 font-body text-sm font-medium tracking-wider uppercase hover:bg-gold-dark transition-all duration-300"
              >
                Fale Conosco
              </Link>
              <a
                href="https://wa.me/5518996540883"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-gold text-gold rounded-full px-6 py-2.5 font-body text-sm font-medium tracking-wider uppercase hover:bg-gold hover:text-white transition-all duration-300"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FAQPage;
