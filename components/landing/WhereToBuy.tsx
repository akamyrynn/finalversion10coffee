"use client";

import Copy from "./_shared/Copy";
import styles from "./WhereToBuy.module.css";

function OzonIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={styles.marketIcon}>
      <rect width="48" height="48" rx="12" fill="#005BFF" />
      <circle cx="24" cy="24" r="10" fill="#FFFFFF" />
      <circle cx="24" cy="24" r="5" fill="#005BFF" />
    </svg>
  );
}

function YandexMarketIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={styles.marketIcon}>
      <rect width="48" height="48" rx="12" fill="#FFCC00" />
      <path d="M24 10C16.8 10 11 15.8 11 23s5.8 13 13 13 13-5.8 13-13S31.2 10 24 10Zm0 19.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z" fill="#1D1D1B" />
      <path d="M28.7 31.2 35 38" stroke="#E31E24" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function WildberriesIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={styles.marketIcon}>
      <rect width="48" height="48" rx="12" fill="#B61B72" />
      <path d="M10 17h5.5l3 14 3.7-14h4.2l3.7 14 3-14H38l-5.3 20h-5l-3.4-12.5L20.8 37h-5.2L10 17Z" fill="#FFFFFF" />
    </svg>
  );
}

const MARKETPLACES = [
  {
    name: "OZON",
    href: "https://www.ozon.ru/category/kofe-v-zernah-31009/10coffee-100159106/",
    icon: OzonIcon,
  },
  {
    name: "Яндекс Маркет",
    href: "https://market.yandex.ru/search?text=10coffee",
    icon: YandexMarketIcon,
  },
  {
    name: "Wildberries",
    href: "https://www.wildberries.ru/catalog/0/search.aspx?search=10coffee",
    icon: WildberriesIcon,
  },
] as const;

export default function WhereToBuy() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {MARKETPLACES.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.card}
              >
                <Icon />
                <span className={styles.cardTitle}>{item.name}</span>
              </a>
            );
          })}
        </div>

        <div className={styles.title}>
          <Copy type="lines" animateOnScroll>
            <h3>ГДЕ КУПИТЬ</h3>
          </Copy>
        </div>
      </div>
    </section>
  );
}
