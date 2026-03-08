import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import ScrollToTop from "./ScrollToTop";
import ScrollProgress from "./ScrollProgress";
import FreeShippingBar from "./FreeShippingBar";
import BottomNav from "./BottomNav";
import CartDrawer from "@/components/cart/CartDrawer";
import NewsletterPopup from "./NewsletterPopup";
import PWAInstallPrompt from "./PWAInstallPrompt";
import PageTransition from "./PageTransition";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip to content (accessibility) */}
      <a href="#main-content" className="skip-to-content">Ir para o conteúdo</a>
      <ScrollProgress />
      <Header />
      <FreeShippingBar />
      <main id="main-content" className="flex-1 mb-bottom-nav">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <WhatsAppButton />
      <ScrollToTop />
      <CartDrawer />
      <BottomNav />
      <NewsletterPopup />
      <PWAInstallPrompt />
    </div>
  );
};

export default Layout;
