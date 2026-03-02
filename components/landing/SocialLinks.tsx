"use client";

import { FaTelegram, FaInstagram, FaVk } from "react-icons/fa";
import styles from "./SocialLinks.module.css";

const SOCIALS = [
  { label: "Telegram", href: "#", icon: FaTelegram },
  { label: "Instagram", href: "#", icon: FaInstagram },
  { label: "ВКонтакте", href: "#", icon: FaVk },
];

export default function SocialLinks() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {SOCIALS.map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            <social.icon />
            {social.label}
          </a>
        ))}
      </div>
    </section>
  );
}
