# Salle Blanche — Секции / Компоненты

Все секции сайта, разбитые по папкам для переиспользования на других проектах.

## Зависимости

```
next, react, react-dom, gsap, @gsap/react, lenis, next-view-transitions, react-icons
```

## Структура

```
sections/
├── _shared/                    Общие утилиты (обязательно для всех секций)
│   ├── globals.css             Базовые стили, цвета, типографика
│   ├── Copy/                   Анимация появления текста (line/word reveal)
│   ├── Button/                 Кнопка с hover-анимацией по буквам
│   └── hooks/
│       └── useViewTransition   Хук для плавных переходов между страницами
│
├── 01-Preloader/               Прелоадер (полноэкранный, 0-100%, кнопка входа)
├── 02-Nav/                     Навигация + полноэкранное меню с анимациями
│
├── 03-HomeHero/                Главный экран — фоновое фото + заголовок
├── 04-HomeAbout/               Секция "О нас" — sticky текст + 6 фото с параллаксом
│
├── 05-AboutHero/               About — герой с параллакс-заголовком
├── 06-AboutInfo/               About — текстовый блок "Баланс и сдержанность"
│
├── 07-DiningMenu/              Интерактивное меню со стрелками и миникартой
├── 08-MenuHero/                Страница меню — заголовок
├── 09-MenuList/                Страница меню — сетка блюд с анимацией появления
│
├── 10-Testimonials/            Карусель отзывов с drag и инерцией
├── 11-CTA/                     Call-to-action — SVG круг + адрес + фото
├── 12-ImageBanner/             Баннер с фоновым изображением и текстом
├── 13-Marquee/                 Бегущая строка "Непревзойдённый вкус"
├── 14-StickyCards/             6 sticky-карточек (The Craft, Beginning...)
├── 15-Chefs/                   Аватары шефов с hover-анимацией имён
│
├── 16-ReservationHero/         Бронирование — герой с кнопкой
├── 17-ReservationInfo/         Бронирование — 3 инфо-панели (slide + fan анимация)
│
└── 18-Footer/                  Футер с заголовком, кнопкой и открытками на hover
```

## Какая секция где используется

| Страница      | Секции (по порядку)                                                              |
|---------------|----------------------------------------------------------------------------------|
| **Главная**   | Preloader → HomeHero → HomeAbout → DiningMenu → Testimonials → CTA → ImageBanner |
| **О нас**     | AboutHero → AboutInfo → ImageBanner → Marquee → StickyCards → Chefs → CTA        |
| **Меню**      | MenuHero → MenuList → Testimonials                                                |
| **Бронь**     | ReservationHero → ReservationInfo → CTA                                           |
| **Глобально** | Nav (шапка) + Footer (подвал) — на всех страницах                                 |

## Как использовать

1. Скопировать `_shared/` — это база для всех секций
2. Скопировать нужную секцию (папку)
3. Подключить CSS (globals.css + CSS секции)
4. Импортировать компонент и вставить в страницу
5. Скопировать нужные ассеты из `/public/`

## Ассеты (public/)

```
public/
├── home/          hero.jpg, about-1..6.jpg
├── about/         about-hero.jpg, about-image-banner.jpg, sticky-card-1..6.jpg
├── chefs/         avatar1..8.jpg
├── cta/           cta-img.jpg
├── dining-menu/   dining-menu.jpg, dining-menu-breakfast.jpg, ...
├── footer/        footer-img-1..5.jpg
├── image-banner/  image-banner.jpg
├── menu/          menu-home.jpg, menu-essence.jpg, menu-carte.jpg, menu-book.jpg
└── testimonials/  sophie.jpg, olivia.jpg, lucas.jpg, fine.jpg, emma.jpg, james.jpg, clara.jpg
```
