"use client";

import Copy from "./_shared/Copy";
import styles from "./VideoHero.module.css";

export default function VideoHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroMedia}>
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/landing/hero-poster.jpg"
        >
          <source src="/landing/hero-video.mp4" type="video/mp4" />
        </video>
      </div>

      <div className={styles.heroOverlay} />

      <div className={styles.heroContainer}>
        <Copy type="words" animateOnScroll={false} delay={0.85}>
          <h1>
            <span>Мы не делаем</span>
            <br />
            <span>шаблонов</span>
          </h1>
        </Copy>
      </div>

      <div className={styles.heroFooter}>
        <Copy type="lines" animateOnScroll={false} delay={1.1}>
          <p className="sm">Кофе для бизнеса</p>
        </Copy>
        <Copy type="lines" animateOnScroll={false} delay={1.2}>
          <p className="sm">Свой уникальный продукт</p>
        </Copy>
      </div>
    </section>
  );
}
