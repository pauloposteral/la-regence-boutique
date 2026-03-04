import { Link } from "react-router-dom";
import { Instagram, Facebook, MapPin, Phone, Mail, CreditCard, Smartphone } from "lucide-react";
import NewsletterFooter from "./NewsletterFooter";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <img 
                src="/images/logo-laregence.jpeg" 
                alt="La Régence" 
                className="w-10 h-10 rounded-lg object-cover border border-gold/20" 
              />
              <span className="font-display text-2xl font-semibold tracking-tight">
                La <span className="text-gold italic">Régence</span>
              </span>
            </div>
            <p className="text-sm text-primary-foreground/70 font-body leading-relaxed">
              Cafeteria e torrefação de cafés especiais desde 2006. 
              Cada grão conta uma história de origem, cuidado e paixão.
            </p>
            <div className="flex gap-3 mt-6">
              <a href="https://instagram.com/laregencecafe" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:bg-gold/20 hover:border-gold/50 transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:bg-gold/20 hover:border-gold/50 transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Navegação</h4>
            <ul className="space-y-2.5 text-sm font-body text-primary-foreground/70">
              <li><Link to="/cafes" className="hover:text-gold transition-colors">Nossos Cafés</Link></li>
              <li><Link to="/assinatura" className="hover:text-gold transition-colors">Clube de Assinatura</Link></li>
              <li><Link to="/sobre" className="hover:text-gold transition-colors">Sobre Nós</Link></li>
              <li><Link to="/blog" className="hover:text-gold transition-colors">Blog & Receitas</Link></li>
              <li><Link to="/quiz" className="hover:text-gold transition-colors">Descubra Seu Café</Link></li>
            </ul>
          </div>

          {/* Institucional */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Institucional</h4>
            <ul className="space-y-2.5 text-sm font-body text-primary-foreground/70">
              <li><Link to="/politica-privacidade" className="hover:text-gold transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/termos" className="hover:text-gold transition-colors">Termos de Uso</Link></li>
              <li><Link to="/frete" className="hover:text-gold transition-colors">Política de Frete</Link></li>
              <li><Link to="/trocas" className="hover:text-gold transition-colors">Trocas e Devoluções</Link></li>
              <li><Link to="/rastreamento" className="hover:text-gold transition-colors">Rastrear Pedido</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Contato</h4>
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
        </div>

        {/* Newsletter */}
        <NewsletterFooter />

        {/* Gold separator */}
        <div className="mt-8 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

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
