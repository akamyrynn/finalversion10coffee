import type { CollectionConfig } from "payload"

export const PromoCodes: CollectionConfig = {
  slug: "promo-codes",
  admin: {
    useAsTitle: "code",
    group: "Бизнес",
    description: "Промокоды и скидки",
    defaultColumns: [
      "code",
      "discountType",
      "discountValue",
      "currentUses",
      "isActive",
    ],
  },
  labels: {
    singular: "Промокод",
    plural: "Промокоды",
  },
  fields: [
    {
      name: "code",
      type: "text",
      label: "Код",
      required: true,
      unique: true,
      admin: {
        description: "Промокод вводимый клиентом (заглавные буквы)",
      },
    },
    {
      name: "discountType",
      type: "select",
      label: "Тип скидки",
      required: true,
      options: [
        { label: "Процент (%)", value: "percentage" },
        { label: "Фиксированная сумма (руб)", value: "fixed_amount" },
      ],
    },
    {
      name: "discountValue",
      type: "number",
      label: "Значение скидки",
      required: true,
      min: 0,
      admin: {
        description: "Процент (напр. 10) или сумма в рублях (напр. 500)",
      },
    },
    {
      name: "isSingleUse",
      type: "checkbox",
      label: "Одноразовый (1 раз на клиента)",
      defaultValue: false,
    },
    {
      name: "maxUses",
      type: "number",
      label: "Макс. кол-во использований",
      admin: {
        description: "Оставьте пустым для неограниченного",
      },
    },
    {
      name: "currentUses",
      type: "number",
      label: "Текущее кол-во использований",
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },
    {
      name: "restrictedToEmail",
      type: "email",
      label: "Ограничить по email",
      admin: {
        description: "Только этот клиент сможет использовать промокод",
      },
    },
    {
      name: "minOrderAmount",
      type: "number",
      label: "Мин. сумма заказа (руб)",
      min: 0,
    },
    {
      name: "startsAt",
      type: "date",
      label: "Действует с",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "expiresAt",
      type: "date",
      label: "Действует до",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
        description: "Оставьте пустым для бессрочного",
      },
    },
    {
      name: "isActive",
      type: "checkbox",
      label: "Активен",
      defaultValue: true,
      admin: {
        position: "sidebar",
      },
    },
  ],
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === "admin",
  },
}
