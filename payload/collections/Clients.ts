import type { CollectionConfig } from "payload"

export const Clients: CollectionConfig = {
  slug: "clients",
  admin: {
    useAsTitle: "fullName",
    group: "Пользователи",
    description: "Клиенты платформы",
    defaultColumns: ["fullName", "email", "phone", "createdAt"],
  },
  labels: {
    singular: "Клиент",
    plural: "Клиенты",
  },
  fields: [
    {
      name: "fullName",
      type: "text",
      label: "ФИО",
      required: true,
    },
    {
      name: "email",
      type: "email",
      label: "Email",
      required: true,
      unique: true,
    },
    {
      name: "phone",
      type: "text",
      label: "Телефон",
    },
    {
      name: "supabaseId",
      type: "text",
      label: "Supabase User ID",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },
    {
      name: "companies",
      type: "array",
      label: "Компании",
      fields: [
        { name: "name", type: "text", label: "Название" },
        { name: "inn", type: "text", label: "ИНН" },
        { name: "kpp", type: "text", label: "КПП" },
        { name: "ogrn", type: "text", label: "ОГРН" },
        { name: "legalAddress", type: "text", label: "Юр. адрес" },
        { name: "bankName", type: "text", label: "Банк" },
        { name: "bik", type: "text", label: "БИК" },
        { name: "settlementAccount", type: "text", label: "Расч. счёт" },
        { name: "correspondentAccount", type: "text", label: "Корр. счёт" },
      ],
    },
    // Join field — shows all orders related to this client
    {
      name: "orders",
      type: "join",
      collection: "orders",
      on: "client",
      label: "Заказы клиента",
      admin: {
        description: "Все заказы этого клиента",
      },
    },
  ],
  access: {
    read: () => true,
    create: () => true,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === "admin",
  },
}
