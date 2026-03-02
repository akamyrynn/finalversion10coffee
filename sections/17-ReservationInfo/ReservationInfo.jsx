"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { HiBolt, HiSparkles, HiMoon } from "react-icons/hi2";

import "./ReservationInfo.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MOBILE_BREAKPOINT = 1000;

const DEFAULT_INFO_CARDS = [
  {
    icon: HiBolt,
    title: "Меню",
    description:
      "Откройте для себя изысканный выбор авторских блюд, утончённых напитков и сезонных вкусов, созданных с тихим намерением.",
    items: [
      "Закуски",
      "Вина из погреба",
      "Авторские коктейли",
      "Выбор шефа",
    ],
  },
  {
    icon: HiSparkles,
    title: "Часы работы",
    description:
      "Наше пространство подготовлено для вечеров, наполненных уютом, теплом и неспешной беседой.",
    items: [
      "Пн – Вт: 17:00 – 00:00",
      "Ср – Чт: 17:00 – 00:00",
      "Пт – Сб: 16:00 – 01:00",
      "Воскресенье: 16:00 – 23:00",
    ],
  },
  {
    icon: HiMoon,
    title: "Контакты",
    description:
      "Свяжитесь с нашей командой по любым вопросам. Мы отвечаем с вниманием, заботой и уважением к каждому визиту.",
    items: [
      "+39 055 398 2417",
      "hello@salleblanche.com",
      "press@salleblanche.com",
      "Обслуживание гостей",
    ],
  },
];

const ReservationInfo = ({ cards = DEFAULT_INFO_CARDS }) => {
  const infoSectionRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const [rebuildKey, setRebuildKey] = useState(0);

  useEffect(() => {
    const handleResize = () =>
      setIsDesktop(window.innerWidth >= MOBILE_BREAKPOINT);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleTransitionComplete = () => setRebuildKey((prev) => prev + 1);
    window.addEventListener("viewTransitionComplete", handleTransitionComplete);
    return () =>
      window.removeEventListener(
        "viewTransitionComplete",
        handleTransitionComplete,
      );
  }, []);

  useGSAP(
    () => {
      const infoSection = infoSectionRef.current;
      if (!infoSection) return;

      infoSection.classList.remove("reservation-info-mobile");

      if (window.__viewTransitioning) return;

      if (!isDesktop) {
        infoSection.classList.add("reservation-info-mobile");
        return;
      }

      const panels = gsap.utils.toArray(
        infoSection.querySelectorAll(".info-panel"),
      );
      const infoCards = gsap.utils.toArray(
        infoSection.querySelectorAll(".info-card"),
      );

      ScrollTrigger.create({
        trigger: infoSection,
        start: "top bottom",
        end: "top top",
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;

          panels.forEach((panel, index) => {
            const staggerDelay = 0.15;
            const duration = 0.7;
            const start = index * staggerDelay;
            const end = start + duration;

            if (progress >= start && progress <= end) {
              const normalised = (progress - start) / duration;
              gsap.set(panel, { y: `${125 - normalised * 125}%` });

              const icon = panel.querySelector(".info-panel-icon");
              const iconThreshold = 0.4;
              const iconProgress = Math.max(
                0,
                (normalised - iconThreshold) / (1 - iconThreshold),
              );
              gsap.set(icon, { scale: iconProgress });
            } else if (progress > end) {
              gsap.set(panel, { y: "0%" });
              gsap.set(panel.querySelector(".info-panel-icon"), { scale: 1 });
            }
          });
        },
      });

      ScrollTrigger.create({
        trigger: infoSection,
        start: "top top",
        end: `+=${window.innerHeight * 3}`,
        pin: true,
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;

          infoCards.forEach((card, index) => {
            const slideStagger = 0.075;
            const slideDuration = 0.4;
            const slideStart = index * slideStagger;
            const slideEnd = slideStart + slideDuration;

            if (progress >= slideStart && progress <= slideEnd) {
              const normalised = (progress - slideStart) / slideDuration;
              const initialX = 350 - index * 100;
              const targetX = -50;
              const currentX = initialX + normalised * (targetX - initialX);
              const currentRotation = 20 - normalised * 20;
              gsap.set(card, { x: `${currentX}%`, rotation: currentRotation });
            } else if (progress > slideEnd) {
              gsap.set(card, { x: "-50%", rotation: 0 });
            }

            const scaleStagger = 0.12;
            const scaleStart = 0.4 + index * scaleStagger;
            const scaleEnd = 1;

            if (progress >= scaleStart && progress <= scaleEnd) {
              const normalised =
                (progress - scaleStart) / (scaleEnd - scaleStart);
              gsap.set(card, { scale: 0.75 + normalised * 0.25 });
            } else if (progress > scaleEnd) {
              gsap.set(card, { scale: 1 });
            }
          });
        },
      });
    },
    {
      scope: infoSectionRef,
      dependencies: [isDesktop, rebuildKey],
      revertOnUpdate: true,
    },
  );

  return (
    <section className="reservation-info" ref={infoSectionRef}>
      <div className="container">
        {cards.map(({ icon: Icon, title, description, items }) => (
          <div className="info-panel" key={title}>
            <div className="info-panel-icon">
              <Icon />
            </div>
            <div className="info-card">
              <Icon className="info-card-icon" />
              <h5>{title}</h5>
              <p>{description}</p>
              <div className="info-card-items">
                {items.map((item) => (
                  <p className="mono" key={item}>
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReservationInfo;
