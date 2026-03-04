import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import CoffeeCarousel from "@/components/home/CoffeeCarousel";
import StorySection from "@/components/home/StorySection";
import BrewMethods from "@/components/home/BrewMethods";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import SubscriptionBanner from "@/components/home/SubscriptionBanner";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <CoffeeCarousel />
      <StorySection />
      <BrewMethods />
      <TestimonialsSection />
      <SubscriptionBanner />
    </Layout>
  );
};

export default Index;
