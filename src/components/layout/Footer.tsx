import { Link } from "react-router-dom";
import { Instagram, Facebook, MapPin, Phone, Mail, CreditCard, Smartphone } from "lucide-react";
import NewsletterFooter from "./NewsletterFooter";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Institucional */}
          <div>
            <h4 className="font-display text-base font-semibold mb-4 uppercase tracking-wide">Institucional</h4>
            <ul className="space-y-2 text-sm font-body text-primary-foreground/70">
              <li><Link to="/sobre" className="hover:text-gold transition-colors">Nossa história</Link></li>
              <li><Link to="/cafes" className="hover:text-gold transition-colors">Nossos cafés</Link></li>
              <li><Link to="/blog" className="hover:text-gold transition-colors">Responsabilidade</Link></li>
            </ul>
          </div>

          {/* Atendimento */}
          <div>
            <h4 className="font-display text-base font-semibold mb-4 uppercase tracking-wide">Atendimento</h4>
            <ul className="space-y-2 text-sm font-body text-primary-foreground/70">
              <li><Link to="/assinatura" className="hover:text-gold transition-colors">Assinatura e kits</Link></li>
              <li><Link to="/rastreamento" className="hover:text-gold transition-colors">Rastrear pedido</Link></li>
              <li><a href="mailto:contato@laregence.com.br" className="hover:text-gold transition-colors">Contato e suporte</a></li>
            </ul>
          </div>

          {/* Políticas */}
          <div>
            <h4 className="font-display text-base font-semibold mb-4 uppercase tracking-wide">Políticas</h4>
            <ul className="space-y-2 text-sm font-body text-primary-foreground/70">
              <li><Link to="/politica-privacidade" className="hover:text-gold transition-colors">Política de privacidade</Link></li>
              <li><Link to="/termos" className="hover:text-gold transition-colors">Condições gerais</Link></li>
              <li><Link to="/trocas" className="hover:text-gold transition-colors">Trocas e devoluções</Link></li>
              <li><Link to="/frete" className="hover:text-gold transition-colors">Envio e entregas</Link></li>
            </ul>
          </div>

          {/* Imprensa */}
          <div>
            <h4 className="font-display text-base font-semibold mb-4 uppercase tracking-wide">Imprensa</h4>
            <ul className="space-y-2 text-sm font-body text-primary-foreground/70">
              <li><span>Press kit / café</span></li>
              <li><span>Parcerias e eventos</span></li>
              <li><span>Consultas e insights</span></li>
            </ul>
            {/* Imagem decorativa */}
            <div className="mt-4 rounded-lg overflow-hidden aspect-[4/3] border border-primary-foreground/10">
              <img
                src="/images/torrefacao.jpeg"
                alt="Torrefação"
                className="w-full h-full object-cover opacity-70"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Contact row */}
        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm font-body text-primary-foreground/60">
          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gold" /> Andradina-SP</span>
          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gold" /> (18) 99654-0883</span>
          <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gold" /> contato@laregence.com.br</span>
        </div>

        {/* Newsletter */}
        <NewsletterFooter />

        {/* Social icons */}
        <div className="flex justify-center gap-4 mt-8">
          <a href="https://instagram.com/laregencecafe" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:bg-gold/20 hover:border-gold/50 transition-colors" aria-label="Instagram">
            <Instagram className="w-4 h-4" />
          </a>
          <a href="#" className="w-9 h-9 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:bg-gold/20 hover:border-gold/50 transition-colors" aria-label="Facebook">
            <Facebook className="w-4 h-4" />
          </a>
        </div>

        {/* Gold badge */}
        <div className="flex justify-center mt-10 mb-4">
          <div className="w-28 h-28 rounded-full border-2 flex items-center justify-center" style={{ borderColor: "hsl(var(--gold) / 0.5)", background: "hsl(var(--gold) / 0.08)" }}>
            <span className="font-display text-sm font-semibold text-center leading-tight" style={{ color: "hsl(var(--gold))" }}>
              La<br /><span className="italic text-base">Régence</span>
            </span>
          </div>
        </div>

        {/* Gold separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        {/* Bottom */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-primary-foreground/50 font-body">
            © {new Date().getFullYear()} La Régence · Todos os direitos reservados · CNPJ: XX.XXX.XXX/0001-XX
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-primary-foreground/50 font-body">Pagamentos seguros via</span>
            <div className="flex gap-2">
              <span className="text-[10px] bg-primary-foreground/10 px-2.5 py-1.5 rounded-md font-body font-medium flex items-center gap-1 border border-primary-foreground/5">
                <CreditCard className="w-3 h-3" /> Stripe
              </span>
              <span className="text-[10px] bg-primary-foreground/10 px-2.5 py-1.5 rounded-md font-body font-medium flex items-center gap-1 border border-primary-foreground/5">
                <Smartphone className="w-3 h-3" /> Pix
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
