"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Heart, Plus, Minus, Coffee } from "lucide-react"
import { useCart } from "@/providers/cart-provider"
import { toggleFavorite } from "@/lib/actions/products"
import { cn } from "@/lib/utils"
import type { Product, ProductVariant } from "@/types"

interface ProductTableRowProps {
  product: Product
  isFavorite: boolean
}

export function ProductTableRow({
  product,
  isFavorite: initialFav,
}: ProductTableRowProps) {
  const { addItem } = useCart()
  const [isFavorite, setIsFavorite] = useState(initialFav)
  const [isPending, startTransition] = useTransition()

  // Find 250g and 1kg variants
  const variant250 =
    product.variants?.find((v) => v.name.includes("250")) ||
    product.variants?.[0]
  const variant1kg = product.variants?.find(
    (v) => v.name.includes("1000") || v.name.includes("1 кг") || v.name.includes("1кг")
  )

  const price250 = variant250?.price ?? 0
  const price1kg = variant1kg?.price ?? 0
  const hasGrind250 =
    variant250?.grind_options && variant250.grind_options.length > 1
  const hasGrind1kg =
    variant1kg?.grind_options && variant1kg.grind_options.length > 1

  const imageUrl = product.images?.[0] || null

  function handleFavorite() {
    setIsFavorite(!isFavorite)
    startTransition(async () => {
      const result = await toggleFavorite(product.id)
      if ("isFavorite" in result) {
        setIsFavorite(result.isFavorite ?? false)
      }
    })
  }

  return (
    <div className="grid grid-cols-[1fr_auto] gap-0 items-center py-2.5 border-b border-neutral-50 hover:bg-white/60 transition-colors group min-w-[700px]">
      {/* Name + image + stickers + fav */}
      <div className="flex items-center gap-3 min-w-0 px-1">
        {/* Thumbnail */}
        <div className="h-10 w-10 rounded-lg bg-neutral-100 shrink-0 overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Coffee className="h-4 w-4 text-neutral-300" />
          )}
        </div>

        {/* Name + description */}
        <div className="min-w-0 flex-1">
          <Link
            href={`/dashboard/product/${product.id}`}
            className="text-[13px] font-semibold text-neutral-900 hover:text-[#5b328a] transition-colors truncate block"
          >
            {product.name}
          </Link>
          {(product.region || product.processing_method) && (
            <p className="text-[11px] text-neutral-400 truncate">
              {[product.region, product.processing_method]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>

        {/* Stickers */}
        {product.stickers?.length > 0 && (
          <div className="flex gap-1 shrink-0">
            {product.stickers.map((s) => (
              <span
                key={s}
                className={cn(
                  "text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase",
                  s === "new"
                    ? "bg-[#faead5] text-[#5b328a]"
                    : s === "popular"
                      ? "bg-[#faead5] text-[#e6610d]"
                      : "bg-[#faead5] text-[#e6610d]"
                )}
              >
                {s === "new" ? "new" : s === "popular" ? "хит" : "sale"}
              </span>
            ))}
          </div>
        )}

        {/* Favorite */}
        <button
          onClick={handleFavorite}
          disabled={isPending}
          className="shrink-0 ml-1"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isFavorite
                ? "fill-red-500 text-red-500"
                : "text-neutral-300 hover:text-red-400"
            )}
          />
        </button>
      </div>

      {/* Variant columns: 250g | 1kg */}
      <div className="grid grid-cols-2 gap-0">
        {/* 250g section */}
        <div className="grid grid-cols-[60px_70px_70px] gap-0 items-center text-center min-w-[200px]">
          <div className="text-[13px] font-semibold text-neutral-900 tabular-nums">
            {price250 > 0 ? Math.round(price250) : "—"}
          </div>
          <div className="flex justify-center">
            {variant250 ? (
              <AddButton
                variant={variant250}
                productId={product.id}
                grindOption="В зёрнах"
                onAdd={addItem}
              />
            ) : (
              <span className="text-neutral-300 text-[11px]">—</span>
            )}
          </div>
          <div className="flex justify-center">
            {variant250 && hasGrind250 ? (
              <AddButton
                variant={variant250}
                productId={product.id}
                grindOption="Молотый"
                onAdd={addItem}
              />
            ) : (
              <span className="text-neutral-300 text-[11px]">—</span>
            )}
          </div>
        </div>

        {/* 1kg section — visually separated */}
        <div className="grid grid-cols-[60px_70px_70px] gap-0 items-center text-center min-w-[200px] border-l-2 border-[#5b328a]/20 pl-1">
          <div className="text-[13px] font-semibold text-neutral-900 tabular-nums">
            {price1kg > 0 ? Math.round(price1kg) : "—"}
          </div>
          <div className="flex justify-center">
            {variant1kg ? (
              <AddButton
                variant={variant1kg}
                productId={product.id}
                grindOption="В зёрнах"
                onAdd={addItem}
              />
            ) : (
              <span className="text-neutral-300 text-[11px]">—</span>
            )}
          </div>
          <div className="flex justify-center">
            {variant1kg && hasGrind1kg ? (
              <AddButton
                variant={variant1kg}
                productId={product.id}
                grindOption="Молотый"
                onAdd={addItem}
              />
            ) : (
              <span className="text-neutral-300 text-[11px]">—</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AddButton({
  variant,
  productId,
  grindOption,
  onAdd,
}: {
  variant: ProductVariant
  productId: string
  grindOption: string
  onAdd: (params: {
    productId: string
    variantId: string
    quantity: number
    grindOption?: string
  }) => Promise<void>
}) {
  const [qty, setQty] = useState(0)

  async function increment() {
    const newQty = qty + 1
    setQty(newQty)
    await onAdd({
      productId,
      variantId: variant.id,
      quantity: 1,
      grindOption,
    })
  }

  function decrement() {
    if (qty > 0) setQty(qty - 1)
  }

  if (qty === 0) {
    return (
      <button
        onClick={increment}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300 text-neutral-400 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
      >
        <Plus className="h-3 w-3" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={decrement}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 text-neutral-500 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
      >
        <Minus className="h-2.5 w-2.5" />
      </button>
      <span className="w-5 text-center text-[11px] font-bold text-neutral-900 tabular-nums">
        {qty}
      </span>
      <button
        onClick={increment}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
      >
        <Plus className="h-2.5 w-2.5" />
      </button>
    </div>
  )
}
