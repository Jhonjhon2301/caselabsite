import { useState } from "react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PromoBanner from "@/components/PromoBanner";
import CategoryIcons from "@/components/CategoryIcons";
import ProductGrid from "@/components/ProductGrid";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main>
        <HeroSection />
        <PromoBanner />
        <CategoryIcons />
        <ProductGrid searchQuery={searchQuery} />
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppFloat />
    </div>
  );
};

export default Index;
