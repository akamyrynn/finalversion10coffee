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
  ],
  access: {
    read: () => true,
    update: ({ req }) => !!req.user,
  },
}
