import path from "path"
import { buildConfig } from "payload"
import { postgresAdapter } from "@payloadcms/db-postgres"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import sharp from "sharp"

import { Categories } from "./payload/collections/Categories"
import { Products } from "./payload/collections/Products"
import { Orders } from "./payload/collections/Orders"
import { PromoCodes } from "./payload/collections/PromoCodes"
import { News } from "./payload/collections/News"
import { Admins } from "./payload/collections/Admins"
import { Clients } from "./payload/collections/Clients"
import { Media } from "./payload/collections/Media"
import { CartItems } from "./payload/collections/CartItems"
import { Favorites } from "./payload/collections/Favorites"
import { SiteSettings } from "./payload/globals/SiteSettings"

export default buildConfig({
  admin: {
    user: Admins.slug,
    meta: {
      titleSuffix: " — 10coffee",
      description: "Панель управления 10coffee",
    },
    dateFormat: "dd.MM.yyyy HH:mm",
  },

  collections: [
    Admins,
    Clients,
    Categories,
    Products,
    Orders,
    PromoCodes,
    News,
    Media,
    CartItems,
    Favorites,
  ],

  globals: [SiteSettings],

  editor: lexicalEditor(),

  secret: process.env.PAYLOAD_SECRET || "your-secret-key-change-this",

  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
    push: true,
  }),

  sharp,

  localization: {
    locales: [{ label: "Русский", code: "ru" }],
    defaultLocale: "ru",
  },
})
