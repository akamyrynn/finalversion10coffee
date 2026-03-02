import { getPayload } from "payload"
import config from "@payload-config"
import { NextResponse } from "next/server"

export const maxDuration = 120

export async function GET() {
  const payload = await getPayload({ config })
  const log: string[] = []
  function l(m: string) { log.push(m); console.log(m) }

  // Helper: find category by slug
  async function getCat(slug: string) {
    const r = await payload.find({ collection: "categories", where: { slug: { equals: slug } }, limit: 1 })
    return r.docs[0]?.id as number | undefined
  }

  // Helper: create product if not exists
  async function p(d: {
    name: string; slug: string; type: "coffee" | "tea" | "accessory"; catSlug: string; sort?: number
    stickers?: string[]; coffee?: any; tea?: any
    variants: { name: string; price: number; wt: number; grind?: boolean }[]
  }) {
    const ex = await payload.find({ collection: "products", where: { slug: { equals: d.slug } }, limit: 1 })
    if (ex.docs.length > 0) { l(`[skip] ${d.name}`); return }
    const catId = await getCat(d.catSlug)
    if (!catId) { l(`[no cat] ${d.catSlug} for ${d.name}`); return }
    const vars = d.variants.map(v => ({
      name: v.name, price: v.price, weightGrams: v.wt, isAvailable: true,
      grindOptions: v.grind ? ["beans", "ground"] : [],
    }))
    try {
      await payload.create({
        collection: "products",
        data: {
          name: d.name, slug: d.slug, productType: d.type, category: catId,
          isVisible: true, sortOrder: d.sort || 0, stickers: d.stickers || [],
          variants: vars, coffeeDetails: d.coffee || {}, teaDetails: d.tea || {},
        },
      })
      l(`[+] ${d.name}`)
    } catch (e: any) { l(`[err] ${d.name}: ${e.message?.substring(0, 60)}`) }
  }

  l("=== SEED 2: Filling all categories ===\n")

  // ─── ДЕКАФЫ ───
  await p({ name: "Бразилия Декаф", slug: "brazil-decaf", type: "coffee", catSlug: "decaf", sort: 1, coffee: { roaster: "10coffee", roastLevel: "Средняя", region: "Бразилия", processingMethod: "Swiss Water", growingHeight: "1000-1300 м", qGraderRating: 80 }, variants: [{ name: "250 г", price: 720, wt: 250, grind: true }, { name: "1 кг", price: 2590, wt: 1000, grind: true }] })
  await p({ name: "Колумбия Декаф", slug: "colombia-decaf", type: "coffee", catSlug: "decaf", sort: 2, coffee: { roaster: "10coffee", roastLevel: "Средняя", region: "Колумбия", processingMethod: "Swiss Water", growingHeight: "1400-1700 м", qGraderRating: 82 }, variants: [{ name: "250 г", price: 780, wt: 250, grind: true }, { name: "1 кг", price: 2790, wt: 1000, grind: true }] })
  await p({ name: "Лоукаф Бразилия 50%", slug: "lowcaf-brazil-50", type: "coffee", catSlug: "decaf", sort: 3, stickers: ["new"], coffee: { roaster: "10coffee", roastLevel: "Средне-тёмная", region: "Бразилия", processingMethod: "Натуральная", growingHeight: "900-1200 м", qGraderRating: 81 }, variants: [{ name: "250 г", price: 650, wt: 250, grind: true }, { name: "1 кг", price: 2350, wt: 1000, grind: true }] })

  // ─── МИКРОЛОТЫ ДЛЯ ЭСПРЕССО ───
  await p({ name: "Кения Кариру АА", slug: "kenya-kariru-aa", type: "coffee", catSlug: "espresso-micro", sort: 1, stickers: ["new"], coffee: { roaster: "10coffee", roastLevel: "Средняя", region: "Кения, Кириньяга", processingMethod: "Мытая", growingHeight: "1700-1900 м", qGraderRating: 89 }, variants: [{ name: "250 г", price: 1290, wt: 250, grind: true }, { name: "1 кг", price: 4590, wt: 1000, grind: true }] })
  await p({ name: "Гватемала Антигуа", slug: "guatemala-antigua", type: "coffee", catSlug: "espresso-micro", sort: 2, coffee: { roaster: "10coffee", roastLevel: "Средняя", region: "Гватемала, Антигуа", processingMethod: "Мытая", growingHeight: "1500-1700 м", qGraderRating: 87 }, variants: [{ name: "250 г", price: 1090, wt: 250, grind: true }, { name: "1 кг", price: 3890, wt: 1000, grind: true }] })

  // ─── МИКРОЛОТЫ ДЛЯ ФИЛЬТРА ───
  await p({ name: "Панама Гейша", slug: "panama-geisha", type: "coffee", catSlug: "filter-micro", sort: 2, stickers: ["popular"], coffee: { roaster: "10coffee", roastLevel: "Светлая", region: "Панама, Бокете", processingMethod: "Мытая", growingHeight: "1600-1800 м", qGraderRating: 91 }, variants: [{ name: "250 г", price: 2490, wt: 250, grind: true }] })

  // ─── LIMITED EDITION ───
  await p({ name: "Руанда Мусаса Лот #12", slug: "rwanda-musasa-12", type: "coffee", catSlug: "limited-edition", sort: 1, stickers: ["new"], coffee: { roaster: "10coffee", roastLevel: "Светлая", region: "Руанда, Мусаса", processingMethod: "Хани", growingHeight: "1800-2100 м", qGraderRating: 90 }, variants: [{ name: "250 г", price: 1890, wt: 250, grind: true }] })
  await p({ name: "Эфиопия Сидамо Нат Лот #7", slug: "ethiopia-sidamo-nat-7", type: "coffee", catSlug: "limited-edition", sort: 2, coffee: { roaster: "10coffee", roastLevel: "Светлая", region: "Эфиопия, Сидамо", processingMethod: "Натуральная", growingHeight: "1900-2200 м", qGraderRating: 89.5 }, variants: [{ name: "250 г", price: 1590, wt: 250, grind: true }] })

  // ─── КАПСУЛЫ ───
  await p({ name: "Капсулы Tucan (10 шт)", slug: "capsules-tucan-10", type: "coffee", catSlug: "nesp-10", sort: 1, stickers: ["popular"], coffee: { roaster: "10coffee", roastLevel: "Средняя", region: "Бразилия, Эфиопия" }, variants: [{ name: "10 капсул", price: 590, wt: 60 }] })
  await p({ name: "Капсулы Бразилия (10 шт)", slug: "capsules-brazil-10", type: "coffee", catSlug: "nesp-10", sort: 2, coffee: { roaster: "10coffee", roastLevel: "Средняя", region: "Бразилия" }, variants: [{ name: "10 капсул", price: 520, wt: 60 }] })
  await p({ name: "Капсулы Колумбия (10 шт)", slug: "capsules-colombia-10", type: "coffee", catSlug: "nesp-10", sort: 3, coffee: { roaster: "10coffee", roastLevel: "Средняя", region: "Колумбия" }, variants: [{ name: "10 капсул", price: 550, wt: 60 }] })

  // ─── ДРИПЫ ───
  await p({ name: "Дрип Эфиопия Джимма (10 шт)", slug: "drip-jimma-10", type: "coffee", catSlug: "drip-10", sort: 1, stickers: ["new"], coffee: { roaster: "10coffee", roastLevel: "Светлая", region: "Эфиопия, Джимма" }, variants: [{ name: "10 дрипов", price: 690, wt: 120 }] })
  await p({ name: "Дрип Бразилия Серрадо (10 шт)", slug: "drip-brazil-10", type: "coffee", catSlug: "drip-10", sort: 2, coffee: { roaster: "10coffee", roastLevel: "Средняя", region: "Бразилия, Серрадо" }, variants: [{ name: "10 дрипов", price: 590, wt: 120 }] })
  await p({ name: "Дрип Колумбия Уила (10 шт)", slug: "drip-colombia-10", type: "coffee", catSlug: "drip-10", sort: 3, coffee: { roaster: "10coffee", roastLevel: "Средняя", region: "Колумбия, Уила" }, variants: [{ name: "10 дрипов", price: 620, wt: 120 }] })
  await p({ name: "Дрип микс 10coffee (10 шт)", slug: "drip-mix-10", type: "coffee", catSlug: "drip-10", sort: 4, stickers: ["popular"], coffee: { roaster: "10coffee", roastLevel: "Разная" }, variants: [{ name: "10 дрипов", price: 650, wt: 120 }] })

  // ─── НАПИТКИ В БАНКАХ ───
  await p({ name: "Колд Брю Классик (4 шт)", slug: "cold-brew-classic-4", type: "coffee", catSlug: "canned", sort: 1, stickers: ["popular"], coffee: { roaster: "10coffee", roastLevel: "Средняя", region: "Бразилия" }, variants: [{ name: "4 банки × 250 мл", price: 490, wt: 1000 }] })
  await p({ name: "Колд Брю Карамель (4 шт)", slug: "cold-brew-caramel-4", type: "coffee", catSlug: "canned", sort: 2, coffee: { roaster: "10coffee", roastLevel: "Средне-тёмная" }, variants: [{ name: "4 банки × 250 мл", price: 520, wt: 1000 }] })
  await p({ name: "Колд Брю Эфиопия (4 шт)", slug: "cold-brew-ethiopia-4", type: "coffee", catSlug: "canned", sort: 3, stickers: ["new"], coffee: { roaster: "10coffee", roastLevel: "Светлая", region: "Эфиопия" }, variants: [{ name: "4 банки × 250 мл", price: 590, wt: 1000 }] })

  // ─── КОФЕЙНЫЙ КОНЦЕНТРАТ ───
  await p({ name: "Концентрат Классик 3л", slug: "concentrate-classic-3l", type: "coffee", catSlug: "concentrate", sort: 1, coffee: { roaster: "10coffee", roastLevel: "Средняя", region: "Бразилия" }, variants: [{ name: "3 л", price: 2990, wt: 3200 }] })
  await p({ name: "Концентрат Эфиопия 3л", slug: "concentrate-ethiopia-3l", type: "coffee", catSlug: "concentrate", sort: 2, stickers: ["new"], coffee: { roaster: "10coffee", roastLevel: "Светлая", region: "Эфиопия" }, variants: [{ name: "3 л", price: 3490, wt: 3200 }] })

  // ─── РАСТВОРИМЫЙ СПЕШЕЛТИ ───
  await p({ name: "Инстант Бразилия (9 шт)", slug: "instant-brazil-9", type: "coffee", catSlug: "instant", sort: 1, coffee: { roaster: "10coffee", roastLevel: "Средняя", region: "Бразилия" }, variants: [{ name: "9 стиков", price: 590, wt: 27 }] })
  await p({ name: "Инстант Колумбия (9 шт)", slug: "instant-colombia-9", type: "coffee", catSlug: "instant", sort: 2, coffee: { roaster: "10coffee", roastLevel: "Средняя", region: "Колумбия" }, variants: [{ name: "9 стиков", price: 620, wt: 27 }] })
  await p({ name: "Инстант Эфиопия (9 шт)", slug: "instant-ethiopia-9", type: "coffee", catSlug: "instant", sort: 3, stickers: ["popular"], coffee: { roaster: "10coffee", roastLevel: "Светлая", region: "Эфиопия" }, variants: [{ name: "9 стиков", price: 690, wt: 27 }] })

  // ─── КАСКАРА ───
  await p({ name: "Каскара Эфиопия", slug: "cascara-ethiopia", type: "tea", catSlug: "cascara", sort: 1, stickers: ["new"], tea: { brewingInstructions: [{ title: "Заваривание", text: "95°C, 4-5 мин. 5 г на 200 мл." }] }, variants: [{ name: "100 г", price: 490, wt: 100 }, { name: "250 г", price: 1090, wt: 250 }] })
  await p({ name: "Каскара Колумбия", slug: "cascara-colombia", type: "tea", catSlug: "cascara", sort: 2, tea: { brewingInstructions: [{ title: "Заваривание", text: "95°C, 4-5 мин. 5 г на 200 мл." }] }, variants: [{ name: "100 г", price: 520, wt: 100 }] })

  // ─── SPECIALTY TEA ───
  await p({ name: "Габа Улун", slug: "gaba-oolong", type: "tea", catSlug: "specialty-tea", sort: 1, stickers: ["popular"], tea: { brewingInstructions: [{ title: "Проливами", text: "90°C, 20-40 сек, до 8 проливов. 5 г на 100 мл." }] }, variants: [{ name: "50 г", price: 690, wt: 50 }, { name: "100 г", price: 1190, wt: 100 }] })
  await p({ name: "Да Хун Пао", slug: "da-hong-pao", type: "tea", catSlug: "specialty-tea", sort: 2, tea: { brewingInstructions: [{ title: "Гунфу ча", text: "95°C, 30 сек — 1 мин. 5-7 г на 150 мл." }] }, variants: [{ name: "50 г", price: 790, wt: 50 }, { name: "100 г", price: 1390, wt: 100 }] })

  // ─── ЧЁРНЫЙ ЧАЙ (ещё) ───
  await p({ name: "Дарджилинг FTGFOP", slug: "darjeeling-ftgfop", type: "tea", catSlug: "black-tea", sort: 2, tea: { brewingInstructions: [{ title: "Классический", text: "90°C, 3-4 мин. 2-3 г на 200 мл." }] }, variants: [{ name: "100 г", price: 590, wt: 100 }, { name: "500 г", price: 2490, wt: 500 }] })
  await p({ name: "Цейлон OP1", slug: "ceylon-op1", type: "tea", catSlug: "black-tea", sort: 3, tea: { brewingInstructions: [{ title: "Классический", text: "95°C, 3-5 мин. 2-3 г на 200 мл." }] }, variants: [{ name: "100 г", price: 350, wt: 100 }, { name: "500 г", price: 1390, wt: 500 }] })

  // ─── ЗЕЛЁНЫЙ ЧАЙ (ещё) ───
  await p({ name: "Лун Цзин (Колодец Дракона)", slug: "long-jing", type: "tea", catSlug: "green-tea", sort: 2, stickers: ["popular"], tea: { brewingInstructions: [{ title: "Китайский способ", text: "80°C, 2-3 мин. 3 г на 150 мл." }] }, variants: [{ name: "50 г", price: 590, wt: 50 }, { name: "100 г", price: 990, wt: 100 }] })
  await p({ name: "Би Ло Чунь", slug: "bi-luo-chun", type: "tea", catSlug: "green-tea", sort: 3, tea: { brewingInstructions: [{ title: "Традиционный", text: "75-80°C, 1-2 мин. 3 г на 150 мл." }] }, variants: [{ name: "50 г", price: 490, wt: 50 }, { name: "100 г", price: 890, wt: 100 }] })

  // ─── ЧЁРНЫЙ С ДОБАВКАМИ ───
  await p({ name: "Эрл Грей", slug: "earl-grey", type: "tea", catSlug: "black-tea-add", sort: 1, stickers: ["popular"], tea: { brewingInstructions: [{ title: "Классический", text: "95°C, 3-5 мин. 2-3 г на 200 мл." }] }, variants: [{ name: "100 г", price: 320, wt: 100 }, { name: "500 г", price: 1290, wt: 500 }] })
  await p({ name: "Масала", slug: "masala", type: "tea", catSlug: "black-tea-add", sort: 2, tea: { brewingInstructions: [{ title: "С молоком", text: "Варить 5 мин с молоком и специями. 5 г на 200 мл." }] }, variants: [{ name: "100 г", price: 390, wt: 100 }, { name: "500 г", price: 1590, wt: 500 }] })
  await p({ name: "Чабрец с бергамотом", slug: "thyme-bergamot", type: "tea", catSlug: "black-tea-add", sort: 3, stickers: ["new"], tea: { brewingInstructions: [{ title: "Заваривание", text: "95°C, 4-5 мин." }] }, variants: [{ name: "100 г", price: 350, wt: 100 }] })

  // ─── ЗЕЛЁНЫЙ С ДОБАВКАМИ ───
  await p({ name: "Жасминовый зелёный", slug: "jasmine-green", type: "tea", catSlug: "green-tea-add", sort: 1, stickers: ["popular"], tea: { brewingInstructions: [{ title: "Китайский способ", text: "80°C, 2-3 мин. 3 г на 200 мл." }] }, variants: [{ name: "100 г", price: 420, wt: 100 }, { name: "500 г", price: 1690, wt: 500 }] })
  await p({ name: "Генмайча (с рисом)", slug: "genmaicha", type: "tea", catSlug: "green-tea-add", sort: 2, tea: { brewingInstructions: [{ title: "Японский", text: "85°C, 2 мин. 4 г на 200 мл." }] }, variants: [{ name: "100 г", price: 450, wt: 100 }] })

  // ─── ФРУКТОВЫЙ ЧАЙ ───
  await p({ name: "Манго-Маракуйя", slug: "mango-passion", type: "tea", catSlug: "fruit-tea", sort: 1, stickers: ["popular"], tea: { brewingInstructions: [{ title: "Заваривание", text: "95°C, 5-7 мин. 3-4 г на 200 мл." }] }, variants: [{ name: "100 г", price: 350, wt: 100 }, { name: "500 г", price: 1390, wt: 500 }] })
  await p({ name: "Лесные ягоды", slug: "forest-berries", type: "tea", catSlug: "fruit-tea", sort: 2, tea: { brewingInstructions: [{ title: "Заваривание", text: "95°C, 5-7 мин." }] }, variants: [{ name: "100 г", price: 320, wt: 100 }, { name: "500 г", price: 1290, wt: 500 }] })
  await p({ name: "Облепиха-Имбирь", slug: "sea-buckthorn-ginger", type: "tea", catSlug: "fruit-tea", sort: 3, stickers: ["new"], tea: { brewingInstructions: [{ title: "Заваривание", text: "95°C, 5 мин." }] }, variants: [{ name: "100 г", price: 380, wt: 100 }] })

  // ─── ТРАВЯНЫЕ СМЕСИ ───
  await p({ name: "Альпийский луг", slug: "alpine-meadow", type: "tea", catSlug: "herbal", sort: 1, tea: { brewingInstructions: [{ title: "Заваривание", text: "95°C, 5-7 мин. 3 г на 200 мл." }] }, variants: [{ name: "100 г", price: 290, wt: 100 }, { name: "500 г", price: 1190, wt: 500 }] })
  await p({ name: "Ромашка с мятой", slug: "chamomile-mint", type: "tea", catSlug: "herbal", sort: 2, stickers: ["popular"], tea: { brewingInstructions: [{ title: "Заваривание", text: "95°C, 5-7 мин." }] }, variants: [{ name: "100 г", price: 270, wt: 100 }] })
  await p({ name: "Иван-чай ферментированный", slug: "ivan-tea", type: "tea", catSlug: "herbal", sort: 3, stickers: ["new"], tea: { brewingInstructions: [{ title: "Заваривание", text: "90°C, 5-10 мин. 3-5 г на 300 мл." }] }, variants: [{ name: "100 г", price: 390, wt: 100 }, { name: "500 г", price: 1590, wt: 500 }] })

  // ─── ПУЭР ───
  await p({ name: "Шу Пуэр Мэнхай", slug: "shu-puerh-menghai", type: "tea", catSlug: "puerh", sort: 1, stickers: ["popular"], tea: { brewingInstructions: [{ title: "Проливами", text: "95-100°C, 10-30 сек, до 10 проливов. 5-7 г на 100 мл." }] }, variants: [{ name: "100 г", price: 590, wt: 100 }, { name: "357 г (блин)", price: 1890, wt: 357 }] })
  await p({ name: "Шэн Пуэр Юньнань 2020", slug: "sheng-puerh-2020", type: "tea", catSlug: "puerh", sort: 2, tea: { brewingInstructions: [{ title: "Проливами", text: "90-95°C, 15-40 сек. 5-7 г на 100 мл." }] }, variants: [{ name: "100 г", price: 790, wt: 100 }, { name: "357 г (блин)", price: 2490, wt: 357 }] })

  // ─── АКСЕССУАРЫ ───
  await p({ name: "Кемекс 6 чашек", slug: "chemex-6-cup", type: "accessory", catSlug: "accessories", sort: 1, stickers: ["popular"], variants: [{ name: "1 шт", price: 4990, wt: 800 }] })
  await p({ name: "V60 Hario 02 керамика", slug: "v60-hario-02", type: "accessory", catSlug: "accessories", sort: 2, variants: [{ name: "1 шт", price: 2490, wt: 350 }] })
  await p({ name: "Фильтры Hario V60 02 (100 шт)", slug: "filters-hario-v60-100", type: "accessory", catSlug: "accessories", sort: 3, variants: [{ name: "100 шт", price: 490, wt: 120 }] })
  await p({ name: "Френч-пресс 350 мл", slug: "french-press-350", type: "accessory", catSlug: "accessories", sort: 4, variants: [{ name: "1 шт", price: 1290, wt: 450 }] })
  await p({ name: "Ручная кофемолка Timemore C2", slug: "timemore-c2", type: "accessory", catSlug: "accessories", sort: 5, stickers: ["popular"], variants: [{ name: "1 шт", price: 5990, wt: 500 }] })
  await p({ name: "Весы Timemore Black Mirror", slug: "timemore-scales", type: "accessory", catSlug: "accessories", sort: 6, stickers: ["new"], variants: [{ name: "1 шт", price: 4490, wt: 350 }] })
  await p({ name: "Гусиная шейка 600 мл", slug: "gooseneck-kettle-600", type: "accessory", catSlug: "accessories", sort: 7, variants: [{ name: "1 шт", price: 3290, wt: 600 }] })
  await p({ name: "Аэропресс", slug: "aeropress", type: "accessory", catSlug: "accessories", sort: 8, variants: [{ name: "1 шт", price: 3990, wt: 400 }] })

  l("\n=== SEED 2 COMPLETE ===")
  return NextResponse.json({ success: true, count: log.filter(l => l.startsWith("[+]")).length, log })
}
