"use client";

import Copy from "./_shared/Copy";
import styles from "./WhereToBuy.module.css";

const MARKETPLACES = [
  {
    name: "OZON",
    href: "https://www.ozon.ru/category/kofe-v-zernah-31009/10coffee-100159106/",
    icon: "/ozon-icon-logo.svg",
  },
  {
    name: "Яндекс Маркет",
    href: "https://market.yandex.ru/search?text=10coffee",
    icon: "/yandex-market-sign-logo.svg",
  },
  {
    name: "Wildberries",
    href: "https://www.wildberries.ru/catalog/0/search.aspx?search=10coffee",
    icon: "/wildberries-sign-logo.svg",
  },
] as const;

export default function WhereToBuy() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Copy type="words" animateOnScroll>
            <h3>ГДЕ КУПИТЬ</h3>
          </Copy>

          <div className={styles.grid}>
            {MARKETPLACES.map((item) => {
              return (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.card}
                >
                  <img src={item.icon} alt="" aria-hidden="true" className={styles.marketIcon} />
                  <span className={styles.cardTitle}>{item.name}</span>
                </a>
              );
            })}
          </div>
        </div>

        <div className={styles.right} aria-hidden="true" />
      </div>
    </section>
  );
}
