import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import CoffeeCarousel from "@/components/home/CoffeeCarousel";
import SEOHead from "@/components/SEOHead";
import LazySection from "@/components/home/LazySection";
import ScrollReveal from "@/components/ui/scroll-reveal";
import { lazy, Suspense } from "react";

const SensoryNotesBanner = lazy(() => import("@/components/home/SensoryNotesBanner"));
const StorySection = lazy(() => import("@/components/home/StorySection"));
const BrewMethods = lazy(() => import("@/components/home/BrewMethods"));
const SubscriptionBanner = lazy(() => import("@/components/home/SubscriptionBanner"));
const StatsSection = lazy(() => import("@/components/home/StatsSection"));
const TestimonialsSection = lazy(() => import("@/components/home/TestimonialsSection"));
const DynamicBanners = lazy(() => import("@/components/home/DynamicBanners"));
const CollectionsSection = lazy(() => import("@/components/home/CollectionsSection"));

const Index = () => {
  const jsonLd = {
    "@context": "https://schema.org", "@type": "CoffeeStore",
    name: "La Régence", description: "Cafeteria e torrefação artesanal de cafés especiais desde 2005 em Andradina-SP.",
    url: "https://laregence.com.br", telephone: "+5518996540883",
    address: { "@type": "PostalAddress", streetAddress: "Avenida Guanabara, 2919 - Stella Maris", addressLocality: "Andradina", addressRegion: "SP", addressCountry: "BR" },
    foundingDate: "2005", priceRange: "$$",
  };

  return (
    <Layout>
      <SEOHead title="Cafés Especiais — Torrefação Artesanal desde 2005" description="La Régence: cafés especiais com torrefação artesanal sob demanda. Grãos selecionados, pontuação SCA 80+, frete grátis acima de R$ 150." jsonLd={jsonLd} />
      <HeroSection />
      <Suspense fallback={<div className="min-h-[60px]" />}>
        <SensoryNotesBanner />
      </Suspense>
      <ScrollReveal>
        <CoffeeCarousel />
      </ScrollReveal>
      <LazySection>
        <Suspense fallback={<div className="min-h-[500px]" />}>
          <ScrollReveal direction="left">
            <StorySection />
          </ScrollReveal>
        </Suspense>
      </LazySection>
      <LazySection>
        <Suspense fallback={<div className="min-h-[400px]" />}>
          <ScrollReveal>
            <BrewMethods />
          </ScrollReveal>
        </Suspense>
      </LazySection>
      <LazySection>
        <Suspense fallback={<div className="min-h-[300px]" />}>
          <ScrollReveal direction="right">
            <SubscriptionBanner />
          </ScrollReveal>
        </Suspense>
      </LazySection>
      <LazySection>
        <Suspense fallback={<div className="min-h-[200px]" />}>
          <ScrollReveal>
            <StatsSection />
          </ScrollReveal>
        </Suspense>
      </LazySection>
      <LazySection>
        <Suspense fallback={<div className="min-h-[300px]" />}>
          <ScrollReveal>
            <TestimonialsSection />
          </ScrollReveal>
        </Suspense>
      </LazySection>
      <LazySection>
        <Suspense fallback={<div className="min-h-[200px]" />}>
          <ScrollReveal>
            <DynamicBanners />
          </ScrollReveal>
        </Suspense>
      </LazySection>
      <LazySection>
        <Suspense fallback={<div className="min-h-[200px]" />}>
          <ScrollReveal>
            <CollectionsSection />
          </ScrollReveal>
        </Suspense>
      </LazySection>
    </Layout>
  );
};

export default Index;
