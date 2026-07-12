import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import ScrollToTop from "./ScrollToTop";
import ScrollProgress from "./ScrollProgress";

// ScrollProgress só faz sentido em conteúdo longo (blog post)
const SCROLL_PROGRESS_PREFIXES = ["/blog/"];
// FreeShippingBar removida do header a pedido — mensagem migra para footer/checkout
import BottomNav from "./BottomNav";
import CartDrawer from "@/components/cart/CartDrawer";
import AbandonedCartBanner from "@/components/cart/AbandonedCartBanner";
// NewsletterPopup desativado a pedido — newsletter continua acessível via Footer
import PWAInstallPrompt from "./PWAInstallPrompt";
import PageTransition from "./PageTransition";
// SocialProofToast removido — prova social falsa quebra confiança premium
import CookieBanner from "./CookieBanner";
import { usePrefetchRoutes } from "@/hooks/usePrefetchRoutes";
import { trackPageView } from "@/lib/analytics";

interface LayoutProps {
  children: ReactNode;
}

const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "La Régence",
  url: "https://lojalaregence.lovable.app",
  logo: "https://lojalaregence.lovable.app/images/logo-laregence.png",
  description: "Cafeteria e torrefação artesanal de cafés especiais desde 2005 em Andradina-SP.",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: "Portuguese",
  },
};

const Layout = ({ children }: LayoutProps) => {
  usePrefetchRoutes();
  const location = useLocation();
  const showScrollProgress = SCROLL_PROGRESS_PREFIXES.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    window.scrollTo(0, 0);
    trackPageView(location.pathname, document.title);
  }, [location.pathname]);
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip to content (accessibility) */}
      <a href="#main-content" className="skip-to-content">Ir para o conteúdo</a>
      {showScrollProgress && <ScrollProgress />}
      <Header />
      <FreeShippingBar />
      <main id="main-content" className="flex-1 mb-bottom-nav">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <WhatsAppButton />
      <ScrollToTop />
      <CartDrawer />
      <AbandonedCartBanner />
      <BottomNav />
      {/* NewsletterPopup removido — exit-intent estava incomodando */}
      <PWAInstallPrompt />
      {/* SocialProofToast removido — sem notificações de compras fabricadas */}
      <CookieBanner />

      {/* Organization Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }}
      />
    </div>
  );
};

export default Layout;
