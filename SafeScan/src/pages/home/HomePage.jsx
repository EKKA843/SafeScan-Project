import React from 'react';
import Navbar from '../../components/layout/Navbar';
import HeroSection from './components/HeroSection';
import FeatureSection from './components/FeatureSection';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <Navbar />
      <main>
        <HeroSection />
        <FeatureSection/>
      </main>
    </div>
  );
}