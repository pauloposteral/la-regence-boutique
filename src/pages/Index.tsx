import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import CoffeeCarousel from "@/components/home/CoffeeCarousel";
import StorySection from "@/components/home/StorySection";
import BrewMethods from "@/components/home/BrewMethods";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import SubscriptionBanner from "@/components/home/SubscriptionBanner";
import DynamicBanners from "@/components/home/DynamicBanners";
import SEOHead from "@/components/SEOHead";

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
      <DynamicBanners />
      <CoffeeCarousel />
      <StorySection />
      <BrewMethods />
      <TestimonialsSection />
      <SubscriptionBanner />
    </Layout>
  );
};

export default Index;
