"use client";

import Copy from "../../_shared/Copy/Copy";

import "./HomeHero.css";

const HomeHero = ({
  image = "/home/hero.jpg",
  title = "Salle Blanche",
  leftLabel = "С 1984 года",
  rightLabel = "Флоренция, Италия",
  delay = 0.85,
}) => {
  const titleParts = title.split(" ");

  return (
    <section className="hero">
      <div className="hero-img">
        <img src={image} alt="" />
      </div>

      <div className="container">
        <Copy type="words" animateOnScroll={false} delay={delay}>
          <h1>
            {titleParts.map((part, i) => (
              <span key={i}>
                {part}
                {i < titleParts.length - 1 && <br />}
              </span>
            ))}
          </h1>
        </Copy>

        <div className="section-footer">
          <Copy type="lines" animateOnScroll={false} delay={delay + 0.25}>
            <p className="sm">{leftLabel}</p>
          </Copy>
          <Copy type="lines" animateOnScroll={false} delay={delay + 0.35}>
            <p className="sm">{rightLabel}</p>
          </Copy>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
