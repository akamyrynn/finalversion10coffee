import { Heart, Coffee } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { createClient } from "@/lib/supabase/server"

export default async function FavoritesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const payload = await getPayload({ config: configPromise })
  const { docs: favDocs } = await payload.find({
    collection: "favorites",
    where: { clientId: { equals: user.id } },
    depth: 2,
    limit: 200,
  })

  // Transform favorites with product data
  const favorites = favDocs.map((fav: any) => {
    const product = typeof fav.product === "object" ? fav.product : null
    const coffee = product?.coffeeDetails || {}
    const imageEntry = product?.images?.[0]
    const imageUrl = imageEntry?.image?.url || imageEntry?.image?.sizes?.card?.url || null

    return {
      id: fav.id,
      productId: product?.id,
      name: product?.name || "Товар",
      region: coffee.region || null,
      productType: product?.productType || "",
      imageUrl,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Избранное</h1>
        <p className="text-muted-foreground">Сохранённые товары</p>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">Нет избранных товаров</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Нажмите на сердечко рядом с товаром, чтобы добавить его в избранное
          </p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/catalog">Перейти в каталог</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/50 transition-colors"
            >
              {/* Thumbnail */}
              <div className="h-12 w-12 rounded-lg bg-coffee-50 flex items-center justify-center shrink-0 overflow-hidden">
                {fav.imageUrl ? (
                  <img src={fav.imageUrl} alt={fav.name} className="h-full w-full object-cover" />
                ) : (
                  <Coffee className="h-5 w-5 text-coffee-200" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/dashboard/product/${fav.productId}`}
                  className="font-medium hover:text-primary transition-colors"
                >
                  {fav.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {fav.region || fav.productType}
                </p>
              </div>
              <Heart className="h-4 w-4 fill-red-500 text-red-500 shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
