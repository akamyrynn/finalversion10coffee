"use client";

import Copy from "../../_shared/Copy/Copy";

import "./MenuHero.css";

const MenuHero = ({
  title = "Меню, ведомое вкусом и временем",
  leftLabel = "Карта блюд",
  rightLabel = "Избранные курсы",
}) => {
  return (
    <section className="menu-hero">
      <div className="container">
        <Copy type="words" animateOnScroll={false} delay={0.85}>
          <h2>{title}</h2>
        </Copy>
      </div>

      <div className="section-footer">
        <Copy type="lines" animateOnScroll={false} delay={1.1}>
          <p className="sm">{leftLabel}</p>
        </Copy>
        <Copy type="lines" animateOnScroll={false} delay={1.2}>
          <p className="sm">{rightLabel}</p>
        </Copy>
      </div>
    </section>
  );
};

export default MenuHero;
