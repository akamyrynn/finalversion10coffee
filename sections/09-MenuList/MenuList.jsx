"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Copy from "../../_shared/Copy/Copy";

import "./MenuList.css";

gsap.registerPlugin(ScrollTrigger);

const CATEGORY_TAGLINES = {
  "Завтраки": "Нежное начало дня, приготовленное с заботой",
  "Общие блюда": "Блюда, созданные для того, чтобы делиться за столом",
  "Пицца": "На дровах, вручную, в классических традициях",
  "Напитки": "От зерна до бокала — каждый глоток продуман",
  "Мороженое": "Маленькие удовольствия для сладкого завершения",
};

function flattenCategoryItems(category) {
  if (category.items) return category.items;
  if (category.groups) {
    return category.groups.flatMap((group) =>
      group.items.map((item) => ({ ...item, group: group.title })),
    );
  }
  return [];
}

const MenuList = ({ menuData = [], taglines = CATEGORY_TAGLINES }) => {
  const menuListRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".menu-grid").forEach((grid) => {
        const cards = grid.querySelectorAll(".menu-grid-card");

        gsap.set(cards, { opacity: 0, y: 30, scale: 0.75 });

        ScrollTrigger.create({
          trigger: grid,
          start: "top 70%",
          once: true,
          onEnter: () => {
            gsap.to(cards, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.6,
              ease: "power2.out",
              stagger: 0.08,
            });
          },
        });
      });
    }, menuListRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="menu-list" ref={menuListRef}>
      <div className="container">
        {menuData.map((category, categoryIndex) => {
          const items = flattenCategoryItems(category);
          const tagline = taglines[category.category];

          return (
            <div className="menu-category" key={categoryIndex}>
              <div className="menu-category-header">
                <Copy type="words" animateOnScroll>
                  <h3>{category.category}</h3>
                </Copy>
                {tagline && (
                  <Copy type="lines" animateOnScroll>
                    <p className="md">{tagline}</p>
                  </Copy>
                )}
              </div>

              <div className="menu-grid">
                {items.map((item, itemIndex) => (
                  <div
                    className={`menu-grid-card ${itemIndex % 2 !== 0 ? "alt" : ""}`}
                    key={itemIndex}
                  >
                    <div className="menu-grid-card-top">
                      <h6>{item.name}</h6>
                      {item.weight && <p className="mono">{item.weight}</p>}
                    </div>

                    {(item.description || item.size) && (
                      <p>{item.description || item.size}</p>
                    )}

                    <p className="menu-grid-card-price">{item.price}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MenuList;
