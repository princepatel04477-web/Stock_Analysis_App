"use client";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import TickerSection from "@/components/landing/TickerSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import PayoutsSection from "@/components/landing/PayoutsSection";
import PricingSection from "@/components/landing/PricingSection";
import ProgramsSection from "@/components/landing/ProgramsSection";
import CinematicSection from "@/components/landing/CinematicSection";
import StorySection from "@/components/landing/StorySection";
import WhyChooseUsSection from "@/components/landing/WhyChooseUsSection";
import JoinUsSection from "@/components/landing/JoinUsSection";
import FAQSection from "@/components/landing/FAQSection";
import LetsTalkSection from "@/components/landing/LetsTalkSection";
import DiscordSection from "@/components/landing/DiscordSection";
import FooterSection from "@/components/landing/FooterSection";

export default function Home() {
  return (
    <main className="bg-[#0a0a0a] min-h-screen font-sans">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <TickerSection />
      <HowItWorksSection />
      <PayoutsSection />
      <PricingSection />
      <ProgramsSection />
      <CinematicSection />
      <StorySection />
      <WhyChooseUsSection />
      <JoinUsSection />
      <FAQSection />
      <LetsTalkSection />
      <DiscordSection />
      <FooterSection />
    </main>
  );
}
