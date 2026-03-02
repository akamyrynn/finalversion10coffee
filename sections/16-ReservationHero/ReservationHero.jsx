"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import Copy from "../../_shared/Copy/Copy";
import Button from "../../_shared/Button/Button";

import "./ReservationHero.css";

const ReservationHero = ({
  title = "Начните свой вечер",
  description = "Забронируйте место для вечера с внимательным обслуживанием, продуманными блюдами и атмосферой, в которой хочется задержаться.",
  buttonText = "Забронировать вечер",
  buttonHref = "/reservation",
  phone = "( +39 055 398 2417 )",
}) => {
  const heroButtonRef = useRef(null);

  useEffect(() => {
    const buttonWrapper = heroButtonRef.current;
    if (!buttonWrapper) return;

    gsap.fromTo(
      buttonWrapper,
      { autoAlpha: 0, y: 40 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        delay: 1.55,
        ease: "power3.out",
      },
    );
  }, []);

  return (
    <section className="reservation-hero">
      <div className="container">
        <Copy type="words" animateOnScroll={false} delay={0.85}>
          <h2>{title}</h2>
        </Copy>

        <Copy type="lines" animateOnScroll={false} delay={1.35}>
          <p className="lg">{description}</p>
        </Copy>

        <div className="reservation-hero-button" ref={heroButtonRef}>
          <Button href={buttonHref}>{buttonText}</Button>
        </div>

        <Copy type="lines" animateOnScroll={false} delay={1.65}>
          <p className="mono">{phone}</p>
        </Copy>
      </div>
    </section>
  );
};

export default ReservationHero;
