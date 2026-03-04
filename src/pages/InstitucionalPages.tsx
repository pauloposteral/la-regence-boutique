import Layout from "@/components/layout/Layout";
import { Link } from "react-router-dom";

const InstitucionalPage = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Layout>
    <section className="py-12 lg:py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
        <h1 className="font-display text-3xl font-semibold mb-8">{title}</h1>
        <div className="prose prose-sm max-w-none font-body text-foreground leading-relaxed space-y-4">
          {children}
        </div>
      </div>
    </section>
  </Layout>
);

export const PoliticaPrivacidadePage = () => (
  <InstitucionalPage title="Política de Privacidade">
    <p>A La Régence Cafés Especiais LTDA ("La Régence"), inscrita no CNPJ sob o nº XX.XXX.XXX/0001-XX, com sede em Andradina-SP, é responsável pelo tratamento dos dados pessoais coletados neste site.</p>
    <h2 className="font-display text-xl font-semibold mt-6">1. Dados coletados</h2>
    <p>Coletamos dados pessoais que você nos fornece diretamente, como nome, e-mail, telefone, CPF e endereço de entrega ao criar sua conta ou realizar uma compra.</p>
    <h2 className="font-display text-xl font-semibold mt-6">2. Finalidade do tratamento</h2>
    <p>Utilizamos seus dados para: processar pedidos e entregas, gerenciar sua conta, enviar comunicações sobre seus pedidos, oferecer promoções (com seu consentimento) e melhorar nossos serviços.</p>
    <h2 className="font-display text-xl font-semibold mt-6">3. Compartilhamento</h2>
    <p>Seus dados poderão ser compartilhados com: transportadoras (para entrega), processadores de pagamento (Stripe), e autoridades quando exigido por lei.</p>
    <h2 className="font-display text-xl font-semibold mt-6">4. Seus direitos (LGPD)</h2>
    <p>Você pode solicitar acesso, correção, exclusão ou portabilidade dos seus dados a qualquer momento pelo e-mail contato@laregence.com.br.</p>
    <h2 className="font-display text-xl font-semibold mt-6">5. Segurança</h2>
    <p>Utilizamos criptografia SSL/TLS, autenticação segura e práticas de segurança da informação para proteger seus dados.</p>
    <p className="text-muted-foreground text-xs mt-8">Última atualização: Março de 2026.</p>
  </InstitucionalPage>
);

export const TermosPage = () => (
  <InstitucionalPage title="Termos de Uso">
    <p>Ao utilizar o site laregence.com.br, você concorda com estes termos de uso.</p>
    <h2 className="font-display text-xl font-semibold mt-6">1. Produtos</h2>
    <p>Os cafés disponíveis em nosso site são de produção artesanal e podem ter variações naturais. As imagens são ilustrativas e as descrições sensoriais são baseadas em degustação profissional.</p>
    <h2 className="font-display text-xl font-semibold mt-6">2. Preços e pagamento</h2>
    <p>Os preços são em Reais (R$) e incluem todos os impostos. Aceitamos cartão de crédito (via Stripe) e Pix. Descontos de Pix são aplicados automaticamente no checkout.</p>
    <h2 className="font-display text-xl font-semibold mt-6">3. Conta do usuário</h2>
    <p>Você é responsável por manter a segurança da sua conta e senha. A La Régence não se responsabiliza por acessos não autorizados decorrentes de negligência do usuário.</p>
    <h2 className="font-display text-xl font-semibold mt-6">4. Propriedade intelectual</h2>
    <p>Todo o conteúdo deste site (textos, imagens, logotipos, design) é propriedade da La Régence e protegido por direitos autorais.</p>
    <p className="text-muted-foreground text-xs mt-8">Última atualização: Março de 2026.</p>
  </InstitucionalPage>
);

export const FretePage = () => (
  <InstitucionalPage title="Política de Frete">
    <h2 className="font-display text-xl font-semibold">Frete grátis</h2>
    <p>Oferecemos frete grátis para pedidos acima de <strong>R$ 150,00</strong> para todo o Brasil.</p>
    <h2 className="font-display text-xl font-semibold mt-6">Prazo de entrega</h2>
    <p>O prazo de entrega varia conforme a região:</p>
    <ul className="list-disc pl-6 space-y-1">
      <li><strong>Sudeste:</strong> 3 a 5 dias úteis</li>
      <li><strong>Sul e Centro-Oeste:</strong> 5 a 8 dias úteis</li>
      <li><strong>Norte e Nordeste:</strong> 7 a 12 dias úteis</li>
    </ul>
    <h2 className="font-display text-xl font-semibold mt-6">Assinantes do Clube</h2>
    <p>Todos os assinantes do Clube La Régence têm <strong>frete grátis</strong> em todas as entregas da assinatura, independentemente do valor.</p>
    <h2 className="font-display text-xl font-semibold mt-6">Rastreamento</h2>
    <p>Após o envio, você receberá um e-mail com o código de rastreamento. Também é possível acompanhar pela sua <Link to="/conta" className="text-accent hover:underline">área do cliente</Link>.</p>
  </InstitucionalPage>
);

export const TrocasPage = () => (
  <InstitucionalPage title="Trocas e Devoluções">
    <h2 className="font-display text-xl font-semibold">Direito de arrependimento</h2>
    <p>Conforme o Código de Defesa do Consumidor, você pode desistir da compra em até <strong>7 dias corridos</strong> após o recebimento, desde que o produto esteja lacrado e em sua embalagem original.</p>
    <h2 className="font-display text-xl font-semibold mt-6">Produtos com defeito</h2>
    <p>Se o produto chegar avariado ou com defeito de fabricação, entre em contato conosco em até 30 dias pelo e-mail <a href="mailto:contato@laregence.com.br" className="text-accent hover:underline">contato@laregence.com.br</a> ou WhatsApp <a href="tel:+5518996540883" className="text-accent hover:underline">(18) 99654-0883</a>.</p>
    <h2 className="font-display text-xl font-semibold mt-6">Como solicitar</h2>
    <ol className="list-decimal pl-6 space-y-1">
      <li>Entre em contato informando o número do pedido</li>
      <li>Envie fotos do produto (se aplicável)</li>
      <li>Aguarde a análise em até 48h úteis</li>
      <li>Após aprovação, enviaremos as instruções de devolução</li>
    </ol>
    <h2 className="font-display text-xl font-semibold mt-6">Reembolso</h2>
    <p>O reembolso será realizado na mesma forma de pagamento original em até 10 dias úteis após recebermos o produto devolvido.</p>
  </InstitucionalPage>
);

export const ContatoPage = () => (
  <InstitucionalPage title="Fale Conosco">
    <p>Estamos à disposição para ajudá-lo! Entre em contato por um dos canais abaixo:</p>
    <div className="grid sm:grid-cols-2 gap-4 mt-6 not-prose">
      <div className="border border-border rounded-lg p-5">
        <h3 className="font-display text-base font-semibold mb-2">📱 WhatsApp</h3>
        <p className="font-body text-sm text-muted-foreground mb-3">Atendimento rápido de Seg a Sáb, 8h às 18h</p>
        <a href="https://wa.me/5518996540883?text=Olá! Gostaria de mais informações sobre os cafés La Régence." target="_blank" rel="noopener noreferrer" className="font-body text-sm text-accent hover:underline font-medium">(18) 99654-0883</a>
      </div>
      <div className="border border-border rounded-lg p-5">
        <h3 className="font-display text-base font-semibold mb-2">✉️ E-mail</h3>
        <p className="font-body text-sm text-muted-foreground mb-3">Respondemos em até 24h úteis</p>
        <a href="mailto:contato@laregence.com.br" className="font-body text-sm text-accent hover:underline font-medium">contato@laregence.com.br</a>
      </div>
    </div>
    <div className="border border-border rounded-lg p-5 mt-4 not-prose">
      <h3 className="font-display text-base font-semibold mb-2">📍 Endereço</h3>
      <p className="font-body text-sm text-muted-foreground">
        Andradina-SP, Brasil<br />
        Seg a Sáb, 8h às 18h
      </p>
    </div>
  </InstitucionalPage>
);

export const RastreamentoPage = () => {
  return (
    <InstitucionalPage title="Rastrear Pedido">
      <p>Para rastrear seu pedido, acesse sua <Link to="/conta" className="text-accent hover:underline font-medium">área do cliente</Link> e veja o status e código de rastreamento na aba "Pedidos".</p>
      <p>Se você comprou como visitante, entre em contato pelo <a href="https://wa.me/5518996540883" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">WhatsApp</a> informando o e-mail usado na compra e ajudaremos a localizar seu pedido.</p>
    </InstitucionalPage>
  );
};
