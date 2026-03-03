"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUp, ArrowDown } from "lucide-react";
import { productMenu } from "./data/product-menu-data";
import Copy from "./_shared/Copy";
import AnimatedButton from "./_shared/AnimatedButton";
import styles from "./ProductImages.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function ProductImages() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isFirst = activeIndex === 0;
  const isLast = activeIndex === productMenu.length - 1;
  const active = productMenu[activeIndex];

  const handlePrev = () => {
    if (!isFirst) setActiveIndex((prev) => prev - 1);
  };
  const handleNext = () => {
    if (!isLast) setActiveIndex((prev) => prev + 1);
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const navButtons = section.querySelectorAll(`.${styles.navBtnWrap}`);
    const previewCard = section.querySelector(`.${styles.previewCard}`);
    const minimapItems = section.querySelectorAll(`.${styles.minimapItem}`);

    gsap.set(navButtons, { scale: 0 });
    gsap.set(previewCard, { autoAlpha: 0, y: 50 });
    gsap.set(minimapItems, { autoAlpha: 0, y: 30 });

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top 30%",
      once: true,
      onEnter: () => {
        gsap.to(navButtons, {
          scale: 1,
          duration: 1,
          ease: "power3.out",
          stagger: 0.1,
        });
        gsap.to(previewCard, {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
        });
        gsap.to(minimapItems, {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.1,
        });
      },
    });

    return () => st.kill();
  }, []);

  return (
    <div className={styles.wrapper}>
    <section className={styles.section} ref={sectionRef}>
      <div className="container">
        <div className={styles.header}>
          <Copy type="words" animateOnScroll>
            <h3>Ассортимент</h3>
          </Copy>
        </div>

        <div className={styles.content}>
          {/* Navigation arrows */}
          <div className={styles.nav}>
            <div className={styles.navBtnWrap}>
              <button
                className={`${styles.navBtn} ${isFirst ? styles.disabled : ""}`}
                disabled={isFirst}
                onClick={handlePrev}
              >
                <ArrowUp className={styles.navIcon} />
              </button>
            </div>
            <div className={styles.navBtnWrap}>
              <button
                className={`${styles.navBtn} ${isLast ? styles.disabled : ""}`}
                disabled={isLast}
                onClick={handleNext}
              >
                <ArrowDown className={styles.navIcon} />
              </button>
            </div>
          </div>

          {/* Central preview card */}
          <div className={styles.preview}>
            <div className={styles.previewCard}>
              <h6>{active.category}</h6>

              {active.items?.map((item, i) => (
                <div key={i} className={styles.previewItem}>
                  <div className={styles.previewRow}>
                    <p>
                      {item.name}{" "}
                      {item.weight && (
                        <span className={styles.weight}>{item.weight}</span>
                      )}
                    </p>
                    <p>{item.price}</p>
                  </div>
                  {item.description && (
                    <p className={styles.itemDesc}>{item.description}</p>
                  )}
                </div>
              ))}

              {active.groups?.map((group, gi) => (
                <div key={gi} className={styles.previewGroup}>
                  <div className={styles.groupHeader}>
                    <span />
                    <p className="mono">{group.title}</p>
                    <span />
                  </div>
                  {group.items.map((item, ii) => (
                    <div key={ii} className={styles.previewRow}>
                      <p>
                        {item.name}{" "}
                        {item.weight && (
                          <span className={styles.weight}>{item.weight}</span>
                        )}
                      </p>
                      <p>{item.price}</p>
                    </div>
                  ))}
                </div>
              ))}

              <div className={styles.previewFooter}>
                <p>10coffee</p>
              </div>
            </div>
          </div>

          {/* Minimap */}
          <div className={styles.minimap}>
            {productMenu.map((menu, i) => (
              <div
                key={i}
                className={`${styles.minimapItem} ${i === activeIndex ? styles.active : ""}`}
                onClick={() => setActiveIndex(i)}
              >
                <div className={styles.minimapImg}>
                  <img src={menu.image} alt={menu.category} />
                </div>
                <p>{menu.category}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.cta}>
          <AnimatedButton href="#price-list-form">
            Получить прайс-лист
          </AnimatedButton>
        </div>
      </div>
    </section>
    </div>
  );
}
