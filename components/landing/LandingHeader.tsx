"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import styles from "./LandingHeader.module.css";

interface LandingHeaderProps {
  onToggleMenu: () => void;
  isMenuOpen: boolean;
}

export default function LandingHeader({
  onToggleMenu,
  isMenuOpen,
}: LandingHeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsCompact(window.scrollY > window.innerHeight * 0.5);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Left navbar — logo + links + burger */}
      <nav
        className={`${styles.navBar} ${isCompact ? styles.navBarCompact : ""}`}
      >
        <div
          className={`${styles.navLeft} ${isCompact ? styles.hideOnCompact : ""}`}
        >
          <a href="/" className={styles.navLogo}>
            <img src="/logo.svg" alt="10coffee" className={styles.navLogoImg} />
          </a>
        </div>

        <div
          className={`${styles.navCenter} ${isCompact ? styles.hideOnCompact : ""}`}
        >
          <button type="button" className={styles.navLink} title="Скоро" onClick={() => {}}>
            Где попробовать
          </button>
          <a
            href="https://10cofshop.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.navLink}
          >
            Интернет-магазин
          </a>
        </div>

        <button
          type="button"
          className={`${styles.burger} ${isMenuOpen ? styles.burgerOpen : ""}`}
          onClick={onToggleMenu}
          aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
        >
          <span className={styles.burgerLine} />
          <span className={styles.burgerLine} />
          <span className={styles.burgerLine} />
        </button>
      </nav>

      {/* Right side — ЛК / profile */}
      <div
        className={`${styles.navRight} ${isCompact ? styles.navRightCompact : ""}`}
      >
        {user ? (
          <a href="/dashboard" className={styles.navAvatar}>
            {user.user_metadata?.full_name?.[0]?.toUpperCase() ||
              user.email?.[0]?.toUpperCase() ||
              "U"}
          </a>
        ) : (
          <button
            type="button"
            className={`${styles.navPillBtn} ${isCompact ? styles.navPillBtnCompact : ""}`}
            onClick={() => router.push("/?auth=login")}
          >
            {isCompact ? "ЛК" : "Личный кабинет"}
          </button>
        )}
      </div>
    </>
  );
}
