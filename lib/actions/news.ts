"use server"

import { createClient } from "@/lib/supabase/server"

export async function getNewsPaginated(offset: number, limit: number = 10) {
  const supabase = await createClient()

  const { data, count } = await supabase
    .from("news")
    .select("*", { count: "exact" })
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1)

  return {
    items: data || [],
    total: count || 0,
  }
}
