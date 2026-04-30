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
  const baseUrl = "https://cafelaregence.com.br";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "CoffeeStore"],
        "@id": `${baseUrl}/#organization`,
        name: "La Régence",
        alternateName: "La Régence Cafés Especiais",
        description: "Cafeteria e torrefação artesanal de cafés especiais desde 2005 em Andradina-SP.",
        url: baseUrl,
        logo: `${baseUrl}/og-image.png`,
        image: `${baseUrl}/og-image.png`,
        telephone: "+5518996540883",
        email: "contato@cafelaregence.com.br",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Avenida Guanabara, 2919 - Stella Maris",
          addressLocality: "Andradina",
          addressRegion: "SP",
          postalCode: "16901-100",
          addressCountry: "BR",
        },
        foundingDate: "2005",
        priceRange: "$$",
        sameAs: [
          "https://www.instagram.com/cafelaregence",
          "https://www.facebook.com/cafelaregence",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: "La Régence",
        publisher: { "@id": `${baseUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${baseUrl}/cafes?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
        inLanguage: "pt-BR",
      },
    ],
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
