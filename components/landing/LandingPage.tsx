"use client";

import { useRef, useState } from "react";
import LandingHeader from "./LandingHeader";
import BurgerMenu from "./BurgerMenu";
import Preloader from "./Preloader";
import VideoHero from "./VideoHero";
import MapPlaceholder from "./MapPlaceholder";
import ProductShowcase from "./ProductShowcase";
import PartnerTestimonials from "./PartnerTestimonials";
import Advantages from "./Advantages";
import ProductImages from "./ProductImages";
import Marquee from "./Marquee";
import PriceListForm from "./PriceListForm";
import FAQ from "./FAQ";
import Mission from "./Mission";
import Production from "./Production";
import Team from "./Team";
import LetsConnect from "./LetsConnect";
import SocialLinks from "./SocialLinks";
import LandingFooter from "./LandingFooter";

export default function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <Preloader />
      <LandingHeader onToggleMenu={toggleMenu} isMenuOpen={isMenuOpen} />
      <BurgerMenu isOpen={isMenuOpen} onClose={closeMenu} pageRef={pageRef} />

      <div ref={pageRef} style={{ position: "relative", width: "100%", height: "100%" }}>
        <VideoHero />
        <MapPlaceholder />
        <ProductShowcase />
        <PartnerTestimonials />
        <Advantages />
        <ProductImages />
        <Marquee />
        <PriceListForm />
        <FAQ />
        <Mission />
        <Production />
        <Team />
        <LetsConnect />
        <SocialLinks />
        <LandingFooter />
      </div>
    </>
  );
}
