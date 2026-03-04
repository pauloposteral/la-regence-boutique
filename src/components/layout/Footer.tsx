import { Link } from "react-router-dom";
import { Instagram, Facebook, MessageCircle } from "lucide-react";
import NewsletterFooter from "./NewsletterFooter";

const instagramPhotos = [
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&q=60",
  "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&q=60",
  "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=200&q=60",
  "https://images.unsplash.com/photo-1504630083234-14187a9a0a1f?w=200&q=60",
];

const Footer = () => {
  return (
    <footer style={{ backgroundColor: "hsl(var(--mocha))", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Logo & info */}
          <div>
            <div className="flex flex-col items-start mb-4">
              <span className="text-lg mb-1">☕</span>
              <span className="font-display text-xl font-semibold" style={{ color: "hsl(var(--wine))" }}>
                La Régence
              </span>
            </div>
            <p className="text-xs font-body leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              Cafeteria e torrefação artesanal desde 2006.
            </p>
            <div className="mt-4 space-y-1 text-xs font-body" style={{ color: "rgba(255,255,255,0.4)" }}>
              <p>Andradina-SP, Brasil</p>
              <p>(18) 99654-0883</p>
              <p>contato@laregence.com.br</p>
            </div>
          </div>

          {/* Institucional */}
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wide mb-4 text-white">Institucional</h4>
            <ul className="space-y-2 text-xs font-body" style={{ color: "rgba(255,255,255,0.5)" }}>
              <li><Link to="/sobre" className="hover:text-gold transition-colors">Sobre nós</Link></li>
              <li><Link to="/sobre" className="hover:text-gold transition-colors">Nossa Torrefação</Link></li>
              <li><a href="mailto:contato@laregence.com.br" className="hover:text-gold transition-colors">Fale Conosco</a></li>
            </ul>
          </div>

          {/* Assinaturas */}
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wide mb-4 text-white">Assinaturas</h4>
            <ul className="space-y-2 text-xs font-body" style={{ color: "rgba(255,255,255,0.5)" }}>
              <li><Link to="/assinatura" className="hover:text-gold transition-colors">Assinar Agora</Link></li>
              <li><Link to="/assinatura" className="hover:text-gold transition-colors">Planos Disponíveis</Link></li>
              <li><Link to="/assinatura" className="hover:text-gold transition-colors">Como funciona</Link></li>
            </ul>
          </div>

          {/* Políticas */}
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wide mb-4 text-white">Políticas</h4>
            <ul className="space-y-2 text-xs font-body" style={{ color: "rgba(255,255,255,0.5)" }}>
              <li><Link to="/trocas" className="hover:text-gold transition-colors">Política de Troca</Link></li>
              <li><Link to="/politica-privacidade" className="hover:text-gold transition-colors">Privacidade</Link></li>
              <li><Link to="/termos" className="hover:text-gold transition-colors">Termos de Uso</Link></li>
            </ul>
          </div>

          {/* Instagram feed + social */}
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wide mb-4 text-white">Instagram</h4>
            <div className="grid grid-cols-2 gap-1.5 mb-4">
              {instagramPhotos.map((src, i) => (
                <a key={i} href="https://instagram.com/laregencecafe" target="_blank" rel="noopener noreferrer" className="aspect-square rounded overflow-hidden hover:opacity-80 transition-opacity">
                  <img src={src} alt="Instagram" className="w-full h-full object-cover" loading="lazy" />
                </a>
              ))}
            </div>
            <div className="flex gap-3">
              <a href="https://instagram.com/laregencecafe" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)" }} aria-label="Instagram">
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)" }} aria-label="Facebook">
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a href="https://wa.me/5518996540883" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)" }} aria-label="WhatsApp">
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        <NewsletterFooter />

        {/* Gold badge */}
        <div className="flex justify-center mt-12 mb-4">
          <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ border: "2px solid hsl(var(--gold))", background: "hsl(var(--gold) / 0.08)" }}>
            <span className="font-display text-xs font-semibold text-center leading-tight" style={{ color: "hsl(var(--gold))" }}>
              La<br /><span className="italic text-sm">Régence</span>
            </span>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center">
          <p className="text-[11px] font-body" style={{ color: "rgba(255,255,255,0.35)" }}>
            © {new Date().getFullYear()} La Régence · Todos os direitos reservados
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
