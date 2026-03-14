import { Link } from "react-router-dom";
import { Instagram, Facebook, MapPin, Phone, Mail, CreditCard, Smartphone } from "lucide-react";
import NewsletterFooter from "./NewsletterFooter";

const Footer = () => {
  return (
    <footer className="bg-cream-100 border-t border-cream-300">
      <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Institucional */}
          <div>
            <h4 className="text-[11px] font-body font-medium tracking-[0.2em] uppercase text-foreground mb-5">Institucional</h4>
            <ul className="space-y-3 text-sm font-body text-foreground/70">
              <li><Link to="/sobre" className="link-underline-hover hover:text-gold transition-colors duration-300">Nossa história</Link></li>
              <li><Link to="/cafes" className="link-underline-hover hover:text-gold transition-colors duration-300">Nossos cafés</Link></li>
              <li><Link to="/blog" className="link-underline-hover hover:text-gold transition-colors duration-300">Responsabilidade</Link></li>
            </ul>
          </div>

          {/* Atendimento */}
          <div>
            <h4 className="text-[11px] font-body font-medium tracking-[0.2em] uppercase text-foreground mb-5">Atendimento</h4>
            <ul className="space-y-3 text-sm font-body text-foreground/70">
              <li><Link to="/assinatura" className="link-underline-hover hover:text-gold transition-colors duration-300">Assinatura e kits</Link></li>
              <li><Link to="/rastreamento" className="link-underline-hover hover:text-gold transition-colors duration-300">Rastrear pedido</Link></li>
              <li><a href="mailto:contato@laregence.com.br" className="link-underline-hover hover:text-gold transition-colors duration-300">Contato e suporte</a></li>
            </ul>
          </div>

          {/* Políticas */}
          <div>
            <h4 className="text-[11px] font-body font-medium tracking-[0.2em] uppercase text-foreground mb-5">Políticas</h4>
            <ul className="space-y-3 text-sm font-body text-foreground/70">
              <li><Link to="/politica-privacidade" className="link-underline-hover hover:text-gold transition-colors duration-300">Política de privacidade</Link></li>
              <li><Link to="/termos" className="link-underline-hover hover:text-gold transition-colors duration-300">Condições gerais</Link></li>
              <li><Link to="/trocas" className="link-underline-hover hover:text-gold transition-colors duration-300">Trocas e devoluções</Link></li>
              <li><Link to="/frete" className="link-underline-hover hover:text-gold transition-colors duration-300">Envio e entregas</Link></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-[11px] font-body font-medium tracking-[0.2em] uppercase text-foreground mb-5">Contato</h4>
            <ul className="space-y-3 text-sm font-body text-foreground/70">
              <li><Link to="/contato" className="link-underline-hover hover:text-gold transition-colors duration-300">Fale conosco</Link></li>
              <li><Link to="/frete" className="link-underline-hover hover:text-gold transition-colors duration-300">Prazos e frete</Link></li>
              <li><a href="https://instagram.com/laregencecafe" target="_blank" rel="noopener noreferrer" className="link-underline-hover hover:text-gold transition-colors duration-300">Instagram</a></li>
            </ul>
            <div className="mt-5 rounded-xl overflow-hidden aspect-[4/3] border border-cream-300">
              <img
                src="https://uuuaylqjllxqjjmvdybm.supabase.co/storage/v1/object/public/public-assets/hero-coffee-1773501834638.png"
                alt="Grãos de café torrados La Régence"
                className="w-full h-full object-cover opacity-60 hover:opacity-80 transition-opacity duration-500"
                loading="lazy" />
              
            </div>
          </div>
        </div>

        {/* Contact row */}
        <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm font-body text-muted-foreground">
          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gold" /> Av. Guanabara, 2919 — Stella Maris, Andradina-SP</span>
          <span className="hidden sm:block text-cream-400">·</span>
          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gold" /> (18) 99654-0883</span>
          <span className="hidden sm:block text-cream-400">·</span>
          <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gold" /> contato@laregence.com.br</span>
        </div>

        {/* Newsletter */}
        <NewsletterFooter />

        {/* Social icons */}
        <div className="flex justify-center gap-3 mt-10">
          <a href="https://instagram.com/laregencecafe" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-cream-300 flex items-center justify-center hover:bg-gold/10 hover:border-gold text-foreground/60 hover:text-gold transition-all duration-300" aria-label="Instagram">
            <Instagram className="w-4 h-4" />
          </a>
          <a href="#" className="w-10 h-10 rounded-full border border-cream-300 flex items-center justify-center hover:bg-gold/10 hover:border-gold text-foreground/60 hover:text-gold transition-all duration-300" aria-label="Facebook">
            <Facebook className="w-4 h-4" />
          </a>
        </div>

        {/* Brand emblem */}
        <div className="flex justify-center my-10">
          <img
            src="/images/logo-laregence.png"
            alt="Café La Régence"
            className="h-24 lg:h-32 w-auto object-contain"
            loading="lazy"
          />
        </div>

        

        {/* Separator */}
        <div className="h-px bg-cream-300" />

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-body">
            © {new Date().getFullYear()} Cafe La Regence Ltda · CNPJ: 07.717.979/0001-62 · Todos os direitos reservados
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground font-body">Pagamentos seguros via</span>
            <div className="flex gap-2">
              <span className="text-[10px] bg-cream-200 px-2.5 py-1.5 rounded-full font-body font-medium flex items-center gap-1 border border-cream-300 text-foreground/70">
                <CreditCard className="w-3 h-3" /> Stripe
              </span>
              <span className="text-[10px] bg-cream-200 px-2.5 py-1.5 rounded-full font-body font-medium flex items-center gap-1 border border-cream-300 text-foreground/70">
                <Smartphone className="w-3 h-3" /> Pix
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>);

};

export default Footer;