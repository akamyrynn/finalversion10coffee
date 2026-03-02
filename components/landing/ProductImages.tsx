"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Copy from "./_shared/Copy";
import AnimatedButton from "./_shared/AnimatedButton";
import styles from "./ProductImages.module.css";

gsap.registerPlugin(ScrollTrigger);

const IMAGE_COUNT = 6;

export default function ProductImages() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const aboutImages = gsap.utils.toArray(`.${styles.aboutImg}`) as HTMLElement[];

      aboutImages.forEach((image) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: image,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });

        tl.fromTo(image, { scale: 0.5 }, { scale: 1.25, ease: "none" }).to(
          image,
          { scale: 0.5, ease: "none" },
        );
      });

      const heading = sectionRef.current?.querySelector(
        `.${styles.aboutHeaderContainer} h3`,
      );
      if (heading) {
        gsap.to(heading, {
          opacity: 0,
          ease: "power1.out",
          scrollTrigger: {
            trigger: `.${styles.aboutImgs}`,
            start: "bottom bottom",
            end: "bottom 30%",
            scrub: true,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className={styles.about} ref={sectionRef}>
      <div className={styles.aboutHeader}>
        <div className={styles.aboutHeaderContainer}>
          <Copy type="lines">
            <h3>
              Мы создаём уникальный продукт, в котором качество, вкус и подача
              сочетаются в единое целое.
            </h3>
          </Copy>

          <div className={styles.aboutFooter}>
            <Copy type="lines" start="top 50%" delay={0.5}>
              <p className="sm">Продукция 10coffee</p>
            </Copy>
            <AnimatedButton href="#price-list-form">
              Получить прайс-лист
            </AnimatedButton>
          </div>
        </div>
      </div>

      <div className={styles.aboutImgs}>
        <div className={styles.aboutImgsContainer}>
          {Array.from({ length: IMAGE_COUNT }, (_, index) => (
            <div key={index + 1} className={styles.aboutImg}>
              <img src={`/landing/products/product-${index + 1}.jpg`} alt="" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
