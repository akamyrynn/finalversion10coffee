import { getPayload } from "payload"
import config from "@payload-config"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  const payload = await getPayload({ config })
  const results: string[] = []

  function log(msg: string) { results.push(msg); console.log(msg) }

  log("=== CLEANING & RE-SEEDING ===")

  // ─── CLEANUP ───
  try {
    await payload.delete({ collection: "cart-items", where: { id: { exists: true } } })
    log("[cleanup] cart-items")
  } catch {}
  try {
    await payload.delete({ collection: "favorites", where: { id: { exists: true } } })
    log("[cleanup] favorites")
  } catch {}
  try {
    await payload.delete({ collection: "products", where: { id: { exists: true } } })
    log("[cleanup] products")
  } catch {}
  try {
    await payload.delete({ collection: "categories", where: { id: { exists: true } } })
    log("[cleanup] categories")
  } catch {}

  // ─── UPLOAD IMAGES ───
  const mediaMap: Record<string, number> = {}
  const pubDir = path.resolve(process.cwd(), "public")

  const imgFiles: [string, string][] = [
    ["Мокап б.п ЭМИГРАНТ.png", "Эмигрант"],
    ["Ассам OPA пнг пачка.png", "Ассам OPA"],
  ]

  for (const [file, alt] of imgFiles) {
    // Check if image already exists
    const existing = await payload.find({
      collection: "media",
      where: { filename: { contains: file.substring(0, 20) } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      mediaMap[file] = existing.docs[0].id as number
      log(`[skip img] ${alt} (exists)`)
      continue
    }

    const fp = path.join(pubDir, file)
    if (!fs.existsSync(fp)) { log(`[skip img] ${file} not found`); continue }
    try {
      const buf = fs.readFileSync(fp)
      const d = await payload.create({
        collection: "media",
        data: { alt },
        file: { data: buf, name: file, mimetype: "image/png", size: buf.length },
      })
      mediaMap[file] = d.id as number
      log(`[+img] ${alt}`)
    } catch (e: any) {
      log(`[err img] ${alt}: ${e.message?.substring(0, 80)}`)
    }
  }

  const espressoImage = mediaMap["Мокап б.п ЭМИГРАНТ.png"] || null
  const teaImage = mediaMap["Ассам OPA пнг пачка.png"] || null

  // ─── CATEGORIES (just 2) ───
  const espressoCat = await payload.create({
    collection: "categories",
    data: {
      name: "Эспрессо",
      slug: "espresso",
      productType: "coffee",
      sortOrder: 1,
      isVisible: true,
      description: "Кофе для приготовления эспрессо — насыщенный вкус и плотное тело",
      image: espressoImage,
    },
  })
  log(`[+cat] Эспрессо (${espressoCat.id})`)

  const blackTeaCat = await payload.create({
    collection: "categories",
    data: {
      name: "Чёрный чай",
      slug: "black-tea",
      productType: "tea",
      sortOrder: 1,
      isVisible: true,
      description: "Классический чёрный чай из лучших регионов",
      image: teaImage,
    },
  })
  log(`[+cat] Чёрный чай (${blackTeaCat.id})`)

  // ─── PRODUCTS (just 2) ───
  try {
    const coffeeProduct = await payload.create({
      collection: "products",
      data: {
        name: "Эмигрант",
        slug: "emigrant",
        productType: "coffee",
        category: espressoCat.id as number,
        isVisible: true,
        sortOrder: 1,
        stickers: ["popular"],
        images: espressoImage ? [{ image: espressoImage }] : [],
        variants: [
          { name: "250 г", sku: "EMG-250", price: 790, weightGrams: 250, isAvailable: true, grindOptions: ["beans", "ground"] },
          { name: "1 кг", sku: "EMG-1000", price: 2850, weightGrams: 1000, isAvailable: true, grindOptions: ["beans", "ground"] },
        ],
        coffeeDetails: {
          roaster: "10coffee",
          roastLevel: "Светло-средняя",
          region: "Эфиопия, Кения",
          processingMethod: "Мытая",
          growingHeight: "1600-2000 м",
          qGraderRating: 86.5,
          brewingMethods: [
            { method: "Эспрессо", description: "18 г кофе, 36 г напитка, 25-30 секунд экстракции. Температура воды 93°C. Яркий цитрусовый вкус с шоколадным послевкусием." },
            { method: "V60", description: "15 г кофе на 250 мл воды. Температура 92-94°C. Предсмачивание 30 секунд, общее время 2:30-3:00 мин." },
            { method: "Аэропресс", description: "15 г кофе, 200 мл воды при 88°C. Время заваривания 1:30 мин. Перевёрнутый метод." },
          ],
        },
        teaDetails: {},
        attachedFiles: [],
      },
    })
    log(`[+prod] Эмигрант (${coffeeProduct.id})`)
  } catch (e: any) {
    log(`[err] Эмигрант: ${e.message?.substring(0, 100)}`)
  }

  try {
    const teaProduct = await payload.create({
      collection: "products",
      data: {
        name: "Ассам OPA",
        slug: "assam-opa",
        productType: "tea",
        category: blackTeaCat.id as number,
        isVisible: true,
        sortOrder: 1,
        stickers: ["popular"],
        images: teaImage ? [{ image: teaImage }] : [],
        variants: [
          { name: "100 г", sku: "ASM-100", price: 390, weightGrams: 100, isAvailable: true, grindOptions: [] },
          { name: "500 г", sku: "ASM-500", price: 1590, weightGrams: 500, isAvailable: true, grindOptions: [] },
        ],
        coffeeDetails: {},
        teaDetails: {
          brewingInstructions: [
            { title: "Классический способ", text: "Температура воды 95°C, время заваривания 3-5 минут. 2-3 г чая на 200 мл воды. Крупный лист раскрывается постепенно, давая насыщенный солодовый вкус." },
            { title: "Холодное заваривание", text: "5 г чая на 500 мл холодной воды. Оставить в холодильнике на 6-8 часов. Мягкий освежающий вкус без горечи." },
          ],
        },
        attachedFiles: [],
      },
    })
    log(`[+prod] Ассам OPA (${teaProduct.id})`)
  } catch (e: any) {
    log(`[err] Ассам OPA: ${e.message?.substring(0, 100)}`)
  }

  log("\n=== SEED COMPLETE ===")
  return NextResponse.json({ success: true, log: results })
}
