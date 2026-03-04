import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import CoffeeCarousel from "@/components/home/CoffeeCarousel";
import SEOHead from "@/components/SEOHead";
import LazySection from "@/components/home/LazySection";
import { lazy, Suspense } from "react";

const SensoryNotesBanner = lazy(() => import("@/components/home/SensoryNotesBanner"));
const SubscriptionBanner = lazy(() => import("@/components/home/SubscriptionBanner"));
const StatsSection = lazy(() => import("@/components/home/StatsSection"));
const TestimonialsSection = lazy(() => import("@/components/home/TestimonialsSection"));

const Index = () => {
  const jsonLd = {
    "@context": "https://schema.org", "@type": "CoffeeStore",
    name: "La Régence", description: "Cafeteria e torrefação artesanal de cafés especiais desde 2006 em Andradina-SP.",
    url: "https://laregence.com.br", telephone: "+5518996540883",
    address: { "@type": "PostalAddress", addressLocality: "Andradina", addressRegion: "SP", addressCountry: "BR" },
    foundingDate: "2006", priceRange: "$$",
  };

  return (
    <Layout>
      <SEOHead title="Cafés Especiais — Torrefação Artesanal desde 2006" description="La Régence: cafés especiais com torrefação artesanal sob demanda. Grãos selecionados, pontuação SCA 80+, frete grátis acima de R$ 150." jsonLd={jsonLd} />
      <HeroSection />
      <CoffeeCarousel />
      <LazySection>
        <Suspense fallback={<div className="min-h-[60px]" />}>
          <SensoryNotesBanner />
        </Suspense>
      </LazySection>
      <LazySection>
        <Suspense fallback={<div className="min-h-[300px]" />}>
          <SubscriptionBanner />
        </Suspense>
      </LazySection>
      <LazySection>
        <Suspense fallback={<div className="min-h-[200px]" />}>
          <StatsSection />
        </Suspense>
      </LazySection>
      <LazySection>
        <Suspense fallback={<div className="min-h-[300px]" />}>
          <TestimonialsSection />
        </Suspense>
      </LazySection>
    </Layout>
  );
};

export default Index;
