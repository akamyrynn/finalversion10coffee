"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ADVANTAGES } from "./data/advantages-data";
import styles from "./Advantages.module.css";

gsap.registerPlugin(ScrollTrigger);

const MOBILE_BREAKPOINT = 1000;

export default function Advantages() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: gsap.Context | undefined;
    const section = sectionRef.current;
    if (!section) return;

    const buildScrollAnimation = () => {
      if (ctx) ctx.revert();

      const cardElements = section.querySelectorAll(`.${styles.stickyCard}`);
      cardElements.forEach((card) => gsap.set(card, { clearProps: "all" }));

      if (window.innerWidth < MOBILE_BREAKPOINT) {
        section.classList.add(styles.mobile);
        return;
      }

      section.classList.remove(styles.mobile);

      requestAnimationFrame(() => {
        ctx = gsap.context(() => {
          const cards = gsap.utils.toArray(`.${styles.stickyCard}`) as HTMLElement[];
          const totalCards = cards.length;

          const lastLeftColumnIndex =
            totalCards % 2 === 0 ? totalCards - 2 : totalCards - 1;
          const lastRightColumnIndex =
            totalCards % 2 === 0 ? totalCards - 1 : totalCards - 2;

          cards.forEach((card, index) => {
            const isLastInColumn =
              index === lastLeftColumnIndex || index === lastRightColumnIndex;
            if (isLastInColumn) return;

            gsap
              .timeline({
                scrollTrigger: {
                  trigger: card,
                  start: "bottom top",
                  end: "+=100%",
                  scrub: true,
                },
              })
              .to(card, { yPercent: -100, ease: "none" });
          });

          ScrollTrigger.refresh();
        }, sectionRef);
      });
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
    <div className={styles.stickyCards} ref={sectionRef}>
      {ADVANTAGES.map((card, index) => (
        <div className={styles.stickyCard} key={index}>
          <div className={styles.cardImg}>
            <img src={card.image} alt={card.title} />
          </div>
          <h3>{card.title}</h3>
          <p>{card.description}</p>
        </div>
      ))}
    </div>
  );
}
