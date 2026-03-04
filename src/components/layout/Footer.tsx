import { Link } from "react-router-dom";
import { Instagram, Facebook, MapPin, Phone, Mail, CreditCard, Smartphone } from "lucide-react";
import NewsletterFooter from "./NewsletterFooter";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Institucional */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Institucional</h4>
            <ul className="space-y-2.5 text-sm font-body text-primary-foreground/70">
              <li><Link to="/sobre" className="hover:text-gold transition-colors">Sobre Nós</Link></li>
              <li><Link to="/blog" className="hover:text-gold transition-colors">Blog & Receitas</Link></li>
              <li><Link to="/quiz" className="hover:text-gold transition-colors">Descubra Seu Café</Link></li>
              <li><Link to="/assinatura" className="hover:text-gold transition-colors">Clube de Assinatura</Link></li>
            </ul>
          </div>

          {/* Atendimento */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Atendimento</h4>
            <ul className="space-y-3 text-sm font-body text-primary-foreground/70">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gold" />
                <span>Andradina-SP, Brasil</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0 text-gold" />
                <a href="tel:+5518996540883" className="hover:text-gold transition-colors">(18) 99654-0883</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0 text-gold" />
                <a href="mailto:contato@laregence.com.br" className="hover:text-gold transition-colors">contato@laregence.com.br</a>
              </li>
            </ul>
          </div>

          {/* Políticas */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Políticas</h4>
            <ul className="space-y-2.5 text-sm font-body text-primary-foreground/70">
              <li><Link to="/politica-privacidade" className="hover:text-gold transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/termos" className="hover:text-gold transition-colors">Termos de Uso</Link></li>
              <li><Link to="/frete" className="hover:text-gold transition-colors">Política de Frete</Link></li>
              <li><Link to="/trocas" className="hover:text-gold transition-colors">Trocas e Devoluções</Link></li>
            </ul>
          </div>

          {/* Social & Brand */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Redes Sociais</h4>
            <div className="flex gap-3 mb-6">
              <a href="https://instagram.com/laregencecafe" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:bg-gold/20 hover:border-gold/50 transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:bg-gold/20 hover:border-gold/50 transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
            <Link to="/rastreamento" className="text-sm font-body text-primary-foreground/70 hover:text-gold transition-colors">
              Rastrear Pedido →
            </Link>
          </div>
        </div>

        {/* Newsletter */}
        <NewsletterFooter />

        {/* Gold badge */}
        <div className="flex justify-center mt-10 mb-6">
          <div className="w-24 h-24 rounded-full border-2 border-gold/40 flex items-center justify-center bg-primary-foreground/5">
            <span className="font-display text-sm font-semibold text-center leading-tight" style={{ color: "hsl(var(--gold))" }}>
              La<br /><span className="italic">Régence</span>
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
