import type { GlobalConfig } from "payload"

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Настройки сайта",
  admin: {
    group: "Система",
  },
  fields: [
    {
      name: "loginAnnouncement",
      type: "textarea",
      label: "Объявление в модале входа",
      admin: {
        description: "Текст, который будет показан в модале авторизации на главной странице",
      },
    },
    {
      name: "loginAnnouncementEnabled",
      type: "checkbox",
      label: "Показывать объявление",
      defaultValue: false,
    },
    {
      name: "priceListUrl",
      type: "text",
      label: "Ссылка на прайс-лист",
      admin: {
        description: "URL для скачивания прайс-листа (PDF). Обновляйте здесь при смене файла.",
        placeholder: "/prais-list.pdf",
      },
    },
    {
      name: "vatPercent",
      type: "number",
      label: "Ставка НДС (%)",
      defaultValue: 22,
      min: 0,
      max: 100,
      admin: {
        description: "Глобальная ставка НДС, применяется ко всем новым заказам и счетам. 0 = без НДС.",
      },
    },
  ],
  access: {
    read: () => true,
    update: ({ req }) => !!req.user,
  },
}
