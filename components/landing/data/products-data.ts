export interface ProductCategory {
  id: string;
  label: string;
  items: ProductItem[];
}

export interface ProductItem {
  name: string;
  description: string;
  image: string;
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: "coffee",
    label: "Кофе",
    items: [
      {
        name: "Эспрессо-бленды",
        description: "Авторские смеси для идеального эспрессо",
        image: "/landing/products/espresso.jpg",
      },
      {
        name: "Фильтр-кофе",
        description: "Моносорта для альтернативного заваривания",
        image: "/landing/products/filter.jpg",
      },
      {
        name: "Декаф",
        description: "Бескофеиновый спешелти кофе",
        image: "/landing/products/decaf.jpg",
      },
      {
        name: "Дрип-пакеты",
        description: "Удобный формат для ваших гостей",
        image: "/landing/products/drip.jpg",
      },
    ],
  },
  {
    id: "tea",
    label: "Чай",
    items: [
      {
        name: "Чёрный чай",
        description: "Классические и авторские купажи",
        image: "/landing/products/black-tea.jpg",
      },
      {
        name: "Зелёный чай",
        description: "Китайские и японские сорта",
        image: "/landing/products/green-tea.jpg",
      },
      {
        name: "Улун",
        description: "Полуферментированные чаи высшего качества",
        image: "/landing/products/oolong.jpg",
      },
      {
        name: "Травяные сборы",
        description: "Фруктовые и цветочные композиции",
        image: "/landing/products/herbal.jpg",
      },
    ],
  },
  {
    id: "accessories",
    label: "Аксессуары",
    items: [
      {
        name: "Посуда",
        description: "Чашки, кружки и сервировка",
        image: "/landing/products/cups.jpg",
      },
      {
        name: "Оборудование",
        description: "Кофемолки, весы, воронки",
        image: "/landing/products/equipment.jpg",
      },
    ],
  },
];
