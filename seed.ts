import { getPayload } from "payload"
import config from "./payload.config"
import fs from "fs"
import path from "path"

async function seed() {
  const payload = await getPayload({ config })

  console.log("=== SEEDING 10COFFEE ===\n")

  // ─── CLEANUP ─────────────────────────────────────────
  console.log("Cleaning old data...")
  try {
    await payload.delete({ collection: "cart-items", where: { id: { exists: true } } })
    await payload.delete({ collection: "favorites", where: { id: { exists: true } } })
    await payload.delete({ collection: "products", where: { id: { exists: true } } })
    await payload.delete({ collection: "categories", where: { id: { exists: true } } })
    console.log("  [ok] Old data removed")
  } catch (e: any) {
    console.log(`  [warn] Cleanup: ${e.message}`)
  }

  // ─── 1. UPLOAD IMAGES ─────────────────────────────────
  console.log("\nUploading images...")

  const mediaMap: Record<string, number> = {}
  const publicDir = path.resolve(__dirname, "public")

  const imageFiles = [
    "Мокап б.п ЭМИГРАНТ.png",
    "Ассам OPA пнг пачка.png",
  ]

  for (const filename of imageFiles) {
    const filePath = path.join(publicDir, filename)
    if (!fs.existsSync(filePath)) {
      console.log(`  [skip] ${filename} — not found`)
      continue
    }

    const existing = await payload.find({
      collection: "media",
      where: { filename: { contains: filename.substring(0, 20) } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      mediaMap[filename] = existing.docs[0].id as number
      console.log(`  [skip] ${filename}`)
      continue
    }

    try {
      const buffer = fs.readFileSync(filePath)
      const doc = await payload.create({
        collection: "media",
        data: { alt: filename.replace(/\.(png|jpg)$/, "") },
        file: {
          data: buffer,
          name: filename,
          mimetype: "image/png",
          size: buffer.length,
        },
      })
      mediaMap[filename] = doc.id as number
      console.log(`  [+] ${filename}`)
    } catch (e: any) {
      console.log(`  [err] ${filename}: ${e.message}`)
    }
  }

  // ─── 2. CATEGORIES ────────────────────────────────────
  console.log("\nCreating categories...")

  const espressoImage = mediaMap["Мокап б.п ЭМИГРАНТ.png"] || null
  const teaImage = mediaMap["Ассам OPA пнг пачка.png"] || null

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
  console.log(`  [+] Эспрессо (id: ${espressoCat.id})`)

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
  console.log(`  [+] Чёрный чай (id: ${blackTeaCat.id})`)

  // ─── 3. PRODUCTS ──────────────────────────────────────
  console.log("\nCreating products...")

  // Coffee product: Эмигрант
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
          {
            name: "250 г",
            sku: "EMG-250",
            price: 790,
            weightGrams: 250,
            isAvailable: true,
            grindOptions: ["beans", "ground"],
          },
          {
            name: "1 кг",
            sku: "EMG-1000",
            price: 2850,
            weightGrams: 1000,
            isAvailable: true,
            grindOptions: ["beans", "ground"],
          },
        ],
        coffeeDetails: {
          roaster: "10coffee",
          roastLevel: "Светло-средняя",
          region: "Эфиопия, Кения",
          processingMethod: "Мытая",
          growingHeight: "1600-2000 м",
          qGraderRating: 86.5,
          brewingMethods: [
            {
              method: "Эспрессо",
              description:
                "18 г кофе, 36 г напитка, 25-30 секунд экстракции. Температура воды 93°C. Яркий цитрусовый вкус с шоколадным послевкусием.",
            },
            {
              method: "V60",
              description:
                "15 г кофе на 250 мл воды. Температура 92-94°C. Предсмачивание 30 секунд, общее время 2:30-3:00 мин. Раскрывает цветочные и фруктовые ноты.",
            },
            {
              method: "Аэропресс",
              description:
                "15 г кофе, 200 мл воды при 88°C. Время заваривания 1:30 мин. Перевёрнутый метод. Чистый и сбалансированный вкус.",
            },
          ],
        },
        teaDetails: {},
        attachedFiles: [],
      },
    })
    console.log(`  [+] Эмигрант (id: ${coffeeProduct.id})`)
  } catch (e: any) {
    console.log(`  [err] Эмигрант: ${e.message}`)
  }

  // Tea product: Ассам OPA
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
          {
            name: "100 г",
            sku: "ASM-100",
            price: 390,
            weightGrams: 100,
            isAvailable: true,
            grindOptions: [],
          },
          {
            name: "500 г",
            sku: "ASM-500",
            price: 1590,
            weightGrams: 500,
            isAvailable: true,
            grindOptions: [],
          },
        ],
        coffeeDetails: {},
        teaDetails: {
          brewingInstructions: [
            {
              title: "Классический способ",
              text: "Температура воды 95°C, время заваривания 3-5 минут. 2-3 г чая на 200 мл воды. Крупный лист раскрывается постепенно, давая насыщенный солодовый вкус.",
            },
            {
              title: "Холодное заваривание",
              text: "5 г чая на 500 мл холодной воды. Оставить в холодильнике на 6-8 часов. Мягкий освежающий вкус без горечи.",
            },
          ],
        },
        attachedFiles: [],
      },
    })
    console.log(`  [+] Ассам OPA (id: ${teaProduct.id})`)
  } catch (e: any) {
    console.log(`  [err] Ассам OPA: ${e.message}`)
  }

  console.log("\n=== SEED COMPLETE ===")
  process.exit(0)
}

seed().catch((e) => {
  console.error("Seed failed:", e)
  process.exit(1)
})
