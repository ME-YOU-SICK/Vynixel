import React from 'react';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import BenefitsSection from '../components/landing/BenefitsSection';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';
import LandingHeader from '../components/landing/LandingHeader';

const LandingPage: React.FC = () => {
  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden bg-background">
      <LandingHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <BenefitsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
