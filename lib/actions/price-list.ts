"use server";

import { z } from "zod";

const priceListSchema = z.object({
  name: z.string().min(2, "Введите имя"),
  email: z.string().email("Введите корректный email"),
  phone: z.string().min(5, "Введите номер телефона"),
  company: z.string().optional(),
});

export type PriceListState = {
  success: boolean;
  error?: string;
};

export async function submitPriceListRequest(
  _prev: PriceListState,
  formData: FormData,
): Promise<PriceListState> {
  const parsed = priceListSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Ошибка валидации",
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.from("price_list_requests").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      company: parsed.data.company || null,
    });
    if (error) throw error;

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Произошла ошибка. Попробуйте позже.",
    };
  }
}
