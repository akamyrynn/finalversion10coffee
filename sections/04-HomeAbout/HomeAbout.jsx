"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Copy from "../../_shared/Copy/Copy";

import "./HomeAbout.css";

gsap.registerPlugin(ScrollTrigger);

const ABOUT_IMAGE_COUNT = 6;

const HomeAbout = ({
  heading = "Пространство, построенное на балансе и утончённости, где материалы, свет и присутствие создают нечто естественное.",
  leftLabel = "Изысканная кухня",
  rightLabel = "Утончённая обстановка",
  imagePrefix = "/home/about",
  imageCount = ABOUT_IMAGE_COUNT,
}) => {
  const aboutSectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const aboutImages = gsap.utils.toArray(".about-img");

      aboutImages.forEach((image) => {
        const imageScaleTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: image,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });

        imageScaleTimeline
          .fromTo(image, { scale: 0.5 }, { scale: 1.25, ease: "none" })
          .to(image, { scale: 0.5, ease: "none" });
      });

      gsap.to(".about-header h3", {
        opacity: 0,
        ease: "power1.out",
        scrollTrigger: {
          trigger: ".about-imgs",
          start: "bottom bottom",
          end: "bottom 30%",
          scrub: true,
        },
      });
    }, aboutSectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="about" ref={aboutSectionRef}>
      <div className="about-header">
        <div className="container">
          <Copy type="lines">
            <h3>{heading}</h3>
          </Copy>

          <div className="section-footer">
            <Copy type="lines" trigger=".about" start="top 50%" delay={0.5}>
              <p className="sm">{leftLabel}</p>
            </Copy>
            <Copy type="lines" trigger=".about" start="top 50%" delay={0.6}>
              <p className="sm">{rightLabel}</p>
            </Copy>
          </div>
        </div>
      </div>

      <div className="about-imgs">
        <div className="container">
          {Array.from({ length: imageCount }, (_, index) => (
            <div
              key={index + 1}
              className="about-img"
              id={`about-img-${index + 1}`}
            >
              <img src={`${imagePrefix}-${index + 1}.jpg`} alt="" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeAbout;
