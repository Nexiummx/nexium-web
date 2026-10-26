"use client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useReveal } from "@/components/useReveal";
import { NetworkHero } from "@/components/home/NetworkHero";
import { FitList } from "@/components/home/FitList";
import { ServiceScroll } from "@/components/home/ServiceScroll";
import { ProcessTrack } from "@/components/home/ProcessTrack";
import { WhyNumbers } from "@/components/home/WhyNumbers";
import { Faq } from "@/components/home/Faq";
import { CloseCta } from "@/components/home/CloseCta";

export default function Home() {
  useReveal();

  return (
    <>
      <Header />
      <main id="main">
        <NetworkHero />
        <FitList />
        <ServiceScroll />
        <ProcessTrack />
        <WhyNumbers />
        <Faq />
        <CloseCta />
      </main>
      <Footer />
    </>
  );
}
