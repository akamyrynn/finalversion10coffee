"use server"

import { getPayload } from "payload"
import configPromise from "@payload-config"

export async function getSiteSettings() {
  try {
    const payload = await getPayload({ config: configPromise })
    const settings = await payload.findGlobal({ slug: "site-settings" })
    return settings as { loginAnnouncement?: string; loginAnnouncementEnabled?: boolean; priceListUrl?: string }
  } catch {
    return null
  }
}
