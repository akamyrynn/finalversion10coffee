"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { TEAM_MEMBERS } from "./data/team-data";
import styles from "./Team.module.css";

const MOBILE_BREAKPOINT = 1000;

function SplitChars({ text }: { text: string }) {
  return (
    <h1>
      {text.split("").map((char, index) => (
        <span className={styles.letter} key={index}>
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </h1>
  );
}

export default function Team() {
  const sectionRef = useRef<HTMLElement>(null);
  const avatarContainerRef = useRef<HTMLDivElement>(null);
  const avatarRefs = useRef<(HTMLDivElement | null)[]>([]);
  const nameRefs = useRef<(HTMLDivElement | null)[]>([]);
  const defaultHeadingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const avatarContainer = avatarContainerRef.current;
    const avatars = avatarRefs.current.filter(Boolean) as HTMLDivElement[];
    const memberNames = nameRefs.current.filter(Boolean) as HTMLDivElement[];
    const defaultHeading = defaultHeadingRef.current;

    if (!avatarContainer || !defaultHeading || !avatars.length) return;

    const defaultLetters = defaultHeading.querySelectorAll(`.${styles.letter}`);
    gsap.set(defaultLetters, { y: "0%" });

    type Handler = { element: HTMLDivElement; onEnter: () => void; onLeave: () => void };
    let avatarHandlers: Handler[] = [];
    let handleContainerEnter: (() => void) | null = null;
    let handleContainerLeave: (() => void) | null = null;

    const enableHoverInteractions = () => {
      avatars.forEach((avatar, index) => {
        const nameElement = memberNames[index];
        if (!nameElement) return;

        const nameLetters = nameElement.querySelectorAll(`.${styles.letter}`);

        const handleAvatarEnter = () => {
          gsap.to(avatar, { width: 120, height: 120, duration: 0.5, ease: "power4.out" });
          gsap.to(defaultLetters, {
            y: "-110%", duration: 0.75, ease: "power4.out",
            stagger: { each: 0.025, from: "center" },
          });
          gsap.to(nameLetters, {
            y: "0%", duration: 0.75, ease: "power4.out",
            stagger: { each: 0.025, from: "center" },
          });
        };

        const handleAvatarLeave = () => {
          gsap.to(avatar, { width: 70, height: 70, duration: 0.5, ease: "power4.out" });
          gsap.to(nameLetters, {
            y: "110%", duration: 0.75, ease: "power4.out",
            stagger: { each: 0.025, from: "center" },
          });
        };

        avatar.addEventListener("mouseenter", handleAvatarEnter);
        avatar.addEventListener("mouseleave", handleAvatarLeave);
        avatarHandlers.push({ element: avatar, onEnter: handleAvatarEnter, onLeave: handleAvatarLeave });
      });

      handleContainerEnter = () => {
        gsap.to(defaultLetters, {
          y: "-110%", duration: 0.75, ease: "power4.out",
          stagger: { each: 0.025, from: "center" },
        });
      };

      handleContainerLeave = () => {
        memberNames.forEach((name) => {
          const letters = name.querySelectorAll(`.${styles.letter}`);
          gsap.to(letters, {
            y: "110%", duration: 0.75, ease: "power4.out",
            stagger: { each: 0.025, from: "center" },
          });
        });
        gsap.to(defaultLetters, {
          y: "0%", duration: 0.75, ease: "power4.out",
          stagger: { each: 0.025, from: "center" },
        });
      };

      avatarContainer.addEventListener("mouseenter", handleContainerEnter);
      avatarContainer.addEventListener("mouseleave", handleContainerLeave);
    };

    const disableHoverInteractions = () => {
      avatarHandlers.forEach(({ element, onEnter, onLeave }) => {
        element.removeEventListener("mouseenter", onEnter);
        element.removeEventListener("mouseleave", onLeave);
      });
      avatarHandlers = [];

      if (handleContainerEnter) {
        avatarContainer.removeEventListener("mouseenter", handleContainerEnter);
        handleContainerEnter = null;
      }
      if (handleContainerLeave) {
        avatarContainer.removeEventListener("mouseleave", handleContainerLeave);
        handleContainerLeave = null;
      }

      gsap.set(defaultLetters, { y: "0%" });
      memberNames.forEach((name) => {
        const letters = name.querySelectorAll(`.${styles.letter}`);
        gsap.set(letters, { y: "110%" });
      });
      avatars.forEach((avatar) => gsap.set(avatar, { clearProps: "width,height" }));
    };

    let wasDesktop = window.innerWidth >= MOBILE_BREAKPOINT;

    const handleResize = () => {
      const isDesktop = window.innerWidth >= MOBILE_BREAKPOINT;
      if (isDesktop !== wasDesktop) {
        wasDesktop = isDesktop;
        isDesktop ? enableHoverInteractions() : disableHoverInteractions();
      }
    };

    if (wasDesktop) enableHoverInteractions();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      disableHoverInteractions();
    };
  }, []);

  return (
    <section className={styles.section} ref={sectionRef}>
      <div className={styles.avatars} ref={avatarContainerRef}>
        {TEAM_MEMBERS.map((member, index) => (
          <div
            className={styles.avatar}
            key={index}
            ref={(el) => { avatarRefs.current[index] = el; }}
          >
            <img src={member.image} alt={member.name} />
          </div>
        ))}
      </div>

      <div className={styles.names}>
        <div className={`${styles.name} ${styles.nameDefault}`} ref={defaultHeadingRef}>
          <SplitChars text="Команда" />
        </div>
        {TEAM_MEMBERS.map((member, index) => (
          <div
            className={styles.name}
            key={index}
            ref={(el) => { nameRefs.current[index] = el; }}
          >
            <SplitChars text={member.name} />
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p className="sm">Наши специалисты</p>
        <p className="sm">Опыт и мастерство</p>
      </div>
    </section>
  );
}
