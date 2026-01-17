"use client";

import BenefitsSection from "@/components/BenefitsSection";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import Navbar from "@/components/Navbar";
import PricingSection from "@/components/PricingSection";


const HomePage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <HeroSection />
        <BenefitsSection id="avantages" /> 
        <HowItWorksSection id="fonctionnement" />
        <PricingSection id="tarifs" />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;