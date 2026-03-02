"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Copy from "../../_shared/Copy/Copy";

import "./AboutHero.css";

gsap.registerPlugin(ScrollTrigger);

const MOBILE_BREAKPOINT = 1000;

const AboutHero = ({
  lines = ["Salle", "Blanche", "История"],
  image = "/about/about-hero.jpg",
  imageAlt = "О Salle Blanche",
}) => {
  const heroSectionRef = useRef(null);

  useEffect(() => {
    const heroImage = heroSectionRef.current?.querySelector(".hero-image");
    if (!heroImage) return;

    gsap.fromTo(
      heroImage,
      { autoAlpha: 0, scale: 0.75, y: 50 },
      {
        autoAlpha: 1,
        scale: 1,
        y: 0,
        duration: 1,
        delay: 1.25,
        ease: "power3.out",
      },
    );
  }, []);

  useEffect(() => {
    let ctx;

    const buildScrollAnimation = () => {
      if (ctx) ctx.revert();

      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      const headerOffsetY = isMobile ? "200vh" : "175vh";
      const headerOffsetX = isMobile ? -100 : -150;

      ctx = gsap.context(() => {
        const heroParallaxTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: ".about-hero",
            start: "top top",
            end: "bottom +=1200%",
            scrub: true,
          },
        });

        heroParallaxTimeline
          .to(
            [".hero-heading .heading-line-1", ".hero-heading .heading-line-3"],
            {
              scale: 2,
              y: headerOffsetY,
              xPercent: headerOffsetX,
            },
            "scroll",
          )
          .to(
            ".hero-heading .heading-line-2",
            {
              scale: 2,
              y: headerOffsetY,
              xPercent: -headerOffsetX,
            },
            "scroll",
          )
          .to(
            ".hero-image",
            {
              scaleY: 2.5,
              yPercent: 300,
            },
            "scroll",
          )
          .to(
            ".hero-image img",
            {
              scaleX: 2.5,
            },
            "scroll",
          );
      }, heroSectionRef);
    };

    let wasMobile = window.innerWidth < MOBILE_BREAKPOINT;
    buildScrollAnimation();

    const handleResize = () => {
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      if (isMobile !== wasMobile) {
        wasMobile = isMobile;
        buildScrollAnimation();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (ctx) ctx.revert();
    };
  }, []);

  return (
    <section className="about-hero" ref={heroSectionRef}>
      <div className="about-hero-pin">
        <div className="hero-heading">
          <Copy animateOnScroll={false} delay={0.85}>
            {lines.map((line, i) => (
              <h1 key={i} className={`heading-line-${i + 1}`}>
                {line}
              </h1>
            ))}
          </Copy>
        </div>

        <div className="hero-image">
          <img src={image} alt={imageAlt} />
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
