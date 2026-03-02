"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Copy from "./_shared/Copy";
import styles from "./LetsConnect.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function LetsConnect() {
  const sectionRef = useRef<HTMLElement>(null);
  const circleButtonRef = useRef<HTMLDivElement>(null);
  const circlePathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const circlePath = circlePathRef.current;
    if (!section || !circlePath) return;

    const pathLength = circlePath.getTotalLength();
    const image = section.querySelector(`.${styles.image}`);

    gsap.set(circlePath, {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength,
      rotation: -90,
      transformOrigin: "center center",
    });

    if (image) gsap.set(image, { autoAlpha: 0, scale: 0.75 });

    const scrollTrigger = ScrollTrigger.create({
      trigger: section,
      start: "top 75%",
      once: true,
      onEnter: () => {
        gsap.to(circlePath, {
          strokeDashoffset: 0,
          duration: 1.2,
          delay: 0.6,
          ease: "power2.inOut",
        });
        if (image) {
          gsap.to(image, {
            autoAlpha: 1,
            scale: 1,
            duration: 1,
            ease: "power3.out",
          });
        }
      },
    });

    return () => scrollTrigger.kill();
  }, []);

  useEffect(() => {
    const button = circleButtonRef.current;
    const circlePath = circlePathRef.current;
    if (!button || !circlePath) return;

    const pathLength = circlePath.getTotalLength();
    let hoverTimeline: gsap.core.Timeline | null = null;

    const handleMouseEnter = () => {
      if (hoverTimeline) hoverTimeline.kill();

      hoverTimeline = gsap.timeline();
      hoverTimeline
        .set(circlePath, {
          strokeDashoffset: 0,
          strokeDasharray: pathLength,
          scale: 1,
        })
        .to(circlePath, {
          strokeDashoffset: -pathLength,
          duration: 0.75,
          ease: "power2.inOut",
        })
        .set(circlePath, { strokeDashoffset: pathLength })
        .to(circlePath, {
          strokeDashoffset: 0,
          duration: 0.75,
          ease: "power2.inOut",
        });
    };

    button.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      button.removeEventListener("mouseenter", handleMouseEnter);
      if (hoverTimeline) hoverTimeline.kill();
    };
  }, []);

  return (
    <section className={styles.section} ref={sectionRef} id="lets-connect">
      <div className={styles.container}>
        <div className={styles.content}>
          <Copy type="lines" animateOnScroll start="top 80%">
            <h6>Давайте знакомиться</h6>
          </Copy>

          <Copy type="lines" animateOnScroll start="top 80%">
            <h5>
              Мы всегда рады новым партнёрам. Расскажем о продукции, подберём
              оптимальное решение для вашего бизнеса.
            </h5>
          </Copy>

          <div className={styles.details}>
            <div>
              <Copy type="lines" animateOnScroll start="top 80%" delay={0.3}>
                <p className="mono">info@10coffee.ru</p>
                <p className="mono">+7 (999) 123-45-67</p>
              </Copy>
            </div>
            <div>
              <Copy type="lines" animateOnScroll start="top 80%" delay={0.3}>
                <p className="mono">ПН--ПТ 09:00--18:00</p>
                <p className="mono">СБ 10:00--15:00</p>
              </Copy>
            </div>
          </div>

          <div className={styles.circleButton} ref={circleButtonRef}>
            <a href="mailto:info@10coffee.ru" className={styles.button}>
              <svg
                className={styles.buttonSvg}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 100"
              >
                <path
                  ref={circlePathRef}
                  d="M50,10 A40,40 0 1,1 49.9999,10"
                  stroke="currentColor"
                  strokeWidth="0.75"
                  fill="none"
                />
              </svg>
              <Copy type="lines" animateOnScroll start="top 80%" delay={0.5}>
                <span>Написать нам</span>
              </Copy>
            </a>
          </div>
        </div>

        <div className={styles.image}>
          <img src="/landing/connect.jpg" alt="10coffee team" />
        </div>
      </div>
    </section>
  );
}
