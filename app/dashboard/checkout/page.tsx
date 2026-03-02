"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCart } from "@/providers/cart-provider"
import { createOrder } from "@/lib/actions/orders"
import { checkoutSchema, type CheckoutFormData } from "@/lib/utils/validators"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Loader2 } from "lucide-react"
import { formatPrice, formatWeight } from "@/lib/utils/format"
import { DELIVERY_METHOD_LABELS, SELF_PICKUP_ADDRESS } from "@/lib/utils/constants"
import { toast } from "sonner"
import Link from "next/link"
import type { Company, DeliveryMethod } from "@/types"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, totalWeight, clearCart, appliedPromo } = useCart()
  const currentDiscount = appliedPromo
    ? appliedPromo.discountType === "percentage"
      ? Math.round((totalPrice * appliedPromo.discountValue) / 100)
      : Math.min(appliedPromo.discountValue, totalPrice)
    : 0
  const finalPrice = Math.max(0, totalPrice - currentDiscount)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      company_id: "",
      delivery_method: "self_pickup",
      delivery_address: "",
      comment: "",
    },
  })

  const deliveryMethod = form.watch("delivery_method")

  useEffect(() => {
    async function loadCompanies() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("client_id", user.id)

      if (data) setCompanies(data as Company[])
    }

    loadCompanies()
  }, [])

  async function onSubmit(data: CheckoutFormData) {
    if (items.length === 0) {
      toast.error("Корзина пуста")
      return
    }

    setLoading(true)
    const result = await createOrder({
      companyId: data.company_id,
      deliveryMethod: data.delivery_method as DeliveryMethod,
      deliveryAddress: data.delivery_address,
      comment: data.comment,
      promoCodeId: appliedPromo?.promoCodeId,
      discountAmount: currentDiscount || undefined,
    })

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
    } else {
      await clearCart()
      toast.success("Заказ оформлен! Мы свяжемся с вами для подтверждения.")
      router.push("/dashboard")
    }
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-bold">Корзина пуста</h2>
        <p className="text-muted-foreground mt-2">
          Добавьте товары для оформления заказа
        </p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/catalog">Перейти в каталог</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/catalog">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Оформление заказа
          </h1>
          <p className="text-muted-foreground">
            {items.length} позиций · {formatWeight(totalWeight)} · {formatPrice(totalPrice)}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Company */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Компания</CardTitle>
            </CardHeader>
            <CardContent>
              {companies.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Для оформления заказа нужно добавить компанию
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/companies/new">
                      Добавить компанию
                    </Link>
                  </Button>
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="company_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Выберите компанию</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите компанию" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} (ИНН: {c.inn})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Delivery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Доставка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="delivery_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Способ доставки</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(DELIVERY_METHOD_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {deliveryMethod === "self_pickup" && (
                <p className="text-sm text-muted-foreground">
                  Адрес самовывоза: {SELF_PICKUP_ADDRESS}
                </p>
              )}

              {(deliveryMethod === "cdek" || deliveryMethod === "cap_2000") && (
                <FormField
                  control={form.control}
                  name="delivery_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Адрес доставки</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Город, улица, дом"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Comment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Комментарий</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Комментарий к заказу (необязательно)"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Товары</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Общий вес</span>
                <span>{formatWeight(totalWeight)}</span>
              </div>
              {appliedPromo && currentDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-medium">Скидка</span>
                  <span className="text-green-600 font-medium">
                    −{formatPrice(currentDiscount)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Итого</span>
                <span className="text-primary">{formatPrice(finalPrice)}</span>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading || companies.length === 0}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Оформить заказ
          </Button>
        </form>
      </Form>
    </div>
  )
}
