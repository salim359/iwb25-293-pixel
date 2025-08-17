import { createFileRoute } from "@tanstack/react-router";

import Navbar from "@/components/Navbar";
import Benefits from "@/components/landing/Benefits";
import Hero from "@/components/landing/Hero";
import Partners from "@/components/landing/Partners";
import Reviews from "@/components/landing/Reviews";
import FAQ from "@/components/landing/FAQ";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Navbar />

      <Hero />

      <Benefits />

      <FAQ />

      <CTA />

      <Footer />
    </>
  );
}
