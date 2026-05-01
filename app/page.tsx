"use client";
import { Header } from "@/components/Header";
import { Hero } from "@/components/sections/Hero";
import { ParaQuien } from "@/components/sections/ParaQuien";
import { Servicios } from "@/components/sections/Servicios";
import { ComoTrabajamos } from "@/components/sections/ComoTrabajamos";
import { PorQueNexium } from "@/components/sections/PorQueNexium";
import { FAQ } from "@/components/sections/FAQ";
import { Contacto } from "@/components/sections/Contacto";
import { Footer } from "@/components/Footer";
import { useReveal } from "@/components/useReveal";

export default function Home() {
  useReveal();

  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <ParaQuien />
        <Servicios />
        <ComoTrabajamos />
        <PorQueNexium />
        <FAQ />
        <Contacto />
      </main>
      <Footer />
    </>
  );
}
