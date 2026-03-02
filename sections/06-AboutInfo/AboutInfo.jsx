"use client";

import Copy from "../../_shared/Copy/Copy";

import "./AboutInfo.css";

const AboutInfo = ({
  label = "Баланс и сдержанность",
  paragraphs = [
    "Salle Blanche — это упражнение в тихой композиции, где пространство, свет и материалы сочетаются с осознанной сдержанностью.",
    "В том же духе меню следует выверенному подходу, руководствуясь балансом, ясностью и точностью. Каждый элемент продуман, каждое блюдо создано так, чтобы ощущаться завершённым и естественным.",
  ],
}) => {
  return (
    <section className="about-info">
      <div className="container">
        <Copy>
          <p className="mono">{label}</p>
          {paragraphs.map((text, i) => (
            <h3 key={i}>{text}</h3>
          ))}
        </Copy>
      </div>
    </section>
  );
};

export default AboutInfo;
