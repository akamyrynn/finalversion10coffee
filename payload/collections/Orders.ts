import type { CollectionConfig } from "payload"

export const Orders: CollectionConfig = {
  slug: "orders",
  admin: {
    useAsTitle: "orderId",
    group: "Бизнес",
    description: "Заказы клиентов",
    defaultColumns: [
      "orderId",
      "client",
      "status",
      "paymentStatus",
      "total",
      "createdAt",
    ],
  },
  labels: {
    singular: "Заказ",
    plural: "Заказы",
  },
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        if (operation === "create" && data && !data.orderId) {
          const timestamp = Date.now().toString(36).toUpperCase()
          const random = Math.random().toString(36).substring(2, 5).toUpperCase()
          data.orderId = `10C-${timestamp}-${random}`
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc }) => {
        if (previousDoc && doc.status !== previousDoc.status) {
          console.log(`[Order ${doc.orderId}] Status: ${previousDoc.status} → ${doc.status}`)
        }
      },
    ],
  },
  fields: [
    {
      name: "orderId",
      type: "text",
      label: "ID заказа",
      unique: true,
      admin: {
        readOnly: true,
        description: "Генерируется автоматически",
      },
    },
    {
      name: "client",
      type: "relationship",
      label: "Клиент",
      relationTo: "clients",
      required: true,
    },
    {
      name: "status",
      type: "select",
      label: "Статус заказа",
      required: true,
      defaultValue: "new",
      options: [
        { label: "Новый", value: "new" },
        { label: "Подтверждён", value: "confirmed" },
        { label: "Счёт выставлен", value: "invoiced" },
        { label: "В производстве", value: "in_production" },
        { label: "Готов к отгрузке", value: "ready" },
        { label: "Отгружен", value: "shipped" },
        { label: "Доставлен", value: "delivered" },
        { label: "Отменён", value: "cancelled" },
      ],
    },
    {
      name: "paymentStatus",
      type: "select",
      label: "Статус оплаты",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Ожидает оплаты", value: "pending" },
        { label: "Счёт выставлен", value: "invoiced" },
        { label: "Частично оплачен", value: "partial" },
        { label: "Оплачен", value: "paid" },
        { label: "Возврат", value: "refunded" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "deliveryMethod",
      type: "select",
      label: "Доставка",
      required: true,
      options: [
        { label: "Самовывоз", value: "self_pickup" },
        { label: "СДЭК", value: "cdek" },
        { label: "CAP 2000", value: "cap_2000" },
      ],
    },
    {
      name: "deliveryAddress",
      type: "text",
      label: "Адрес доставки",
    },
    {
      name: "companyName",
      type: "text",
      label: "Компания",
    },
    {
      name: "companyInn",
      type: "text",
      label: "ИНН",
    },
    {
      name: "items",
      type: "array",
      label: "Позиции",
      fields: [
        { name: "productName", type: "text", label: "Товар", required: true },
        { name: "variantName", type: "text", label: "Фасовка", required: true },
        { name: "grindOption", type: "text", label: "Помол" },
        { name: "quantity", type: "number", label: "Кол-во", required: true },
        { name: "unitPrice", type: "number", label: "Цена/шт", required: true },
        { name: "totalPrice", type: "number", label: "Сумма", required: true },
      ],
    },
    {
      name: "subtotal",
      type: "number",
      label: "Сумма товаров",
      required: true,
      admin: { position: "sidebar" },
    },
    {
      name: "discountAmount",
      type: "number",
      label: "Скидка",
      defaultValue: 0,
      admin: { position: "sidebar" },
    },
    {
      name: "deliveryCost",
      type: "number",
      label: "Доставка",
      defaultValue: 0,
      admin: { position: "sidebar" },
    },
    {
      name: "total",
      type: "number",
      label: "ИТОГО",
      required: true,
      admin: { position: "sidebar" },
    },
    {
      name: "totalWeightGrams",
      type: "number",
      label: "Вес (г)",
      admin: { position: "sidebar" },
    },
    {
      name: "promoCode",
      type: "relationship",
      label: "Промокод",
      relationTo: "promo-codes",
    },
    {
      name: "comment",
      type: "textarea",
      label: "Комментарий клиента",
    },
    {
      name: "adminNotes",
      type: "textarea",
      label: "Заметки (видит только админ)",
    },
    {
      name: "cdekTrackingNumber",
      type: "text",
      label: "Трек-номер СДЭК",
    },
  ],
  access: {
    read: () => true,
    create: () => true,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === "admin",
  },
}
