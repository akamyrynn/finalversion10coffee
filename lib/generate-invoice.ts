import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import QRCode from "qrcode"

interface InvoiceItem {
  name: string
  quantity: number
  unit: string
  price: number
  vat: string
  total: number
}

export interface InvoiceData {
  invoiceNumber: string
  invoiceDate: string
  sellerName: string
  sellerInn: string
  sellerAddress: string
  sellerBank: string
  sellerBik: string
  sellerAccount: string
  sellerCorrAccount: string
  buyerName: string
  buyerInn: string
  buyerKpp: string
  buyerAddress: string
  items: InvoiceItem[]
  total: number
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842]) // A4
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const { height } = page.getSize()

  const margin = 40
  let y = height - margin
  const black = rgb(0, 0, 0)
  const gray = rgb(0.4, 0.4, 0.4)

  function text(t: string, x: number, yPos: number, size = 8, f = font, color = black) {
    page.drawText(t, { x, y: yPos, size, font: f, color })
  }

  function line(x1: number, y1: number, x2: number, y2: number) {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 0.5, color: black })
  }

  // --- QR Code ---
  const qrPayload = [
    "ST00012",
    `Name=${data.sellerName}`,
    `PersonalAcc=${data.sellerAccount}`,
    `BankName=${data.sellerBank}`,
    `BIC=${data.sellerBik}`,
    `CorrespAcc=${data.sellerCorrAccount}`,
    `PayeeINN=${data.sellerInn}`,
    `Purpose=Oplata po schetu N${data.invoiceNumber} ot ${data.invoiceDate}, Zakaz N${String(data.invoiceNumber).padStart(6, "0")}`,
    `Sum=${Math.round(data.total * 100)}`,
  ].join("|")

  try {
    const qrPng = await QRCode.toBuffer(qrPayload, {
      width: 120,
      margin: 1,
      errorCorrectionLevel: "M",
    })
    const qrImage = await doc.embedPng(qrPng)
    page.drawImage(qrImage, { x: 480, y: y - 80, width: 80, height: 80 })
  } catch {
    // QR failed, continue
  }

  // --- Header ---
  text("Predoplata 50%", margin, y - 10, 8, font, gray)
  y -= 30

  // --- Bank details ---
  const bx = margin
  const bw = 400

  line(bx, y, bx + bw, y)
  text(`Bank: ${data.sellerBank}`, bx + 4, y - 10, 7)
  text(`BIK: ${data.sellerBik}`, bx + 280, y - 10, 7)
  line(bx, y - 14, bx + bw, y - 14)
  text(`Sch. N: ${data.sellerCorrAccount}`, bx + 280, y - 24, 7)
  line(bx, y - 28, bx + bw, y - 28)

  text(`INN: ${data.sellerInn}`, bx + 4, y - 38, 7)
  text(`Sch. N: ${data.sellerAccount}`, bx + 280, y - 38, 7)
  line(bx, y - 42, bx + bw, y - 42)
  text(data.sellerName, bx + 4, y - 52, 7)
  line(bx, y - 56, bx + bw, y - 56)

  // Vertical divider
  line(bx + 270, y, bx + 270, y - 56)
  // Outer
  line(bx, y, bx, y - 56)
  line(bx + bw, y, bx + bw, y - 56)

  y -= 68

  // --- Buyer ---
  text("Pokupatel:", bx, y, 7, fontBold)
  text(data.buyerName, bx + 55, y, 7)
  y -= 12
  text(`INN ${data.buyerInn}, KPP ${data.buyerKpp}`, bx + 55, y, 7)
  y -= 12
  text(data.buyerAddress, bx + 55, y, 7)
  y -= 20

  // --- Invoice title ---
  text(`Schet na oplatu N ${data.invoiceNumber} ot ${data.invoiceDate}`, bx, y, 14, fontBold)
  y -= 18

  // --- Supplier ---
  text("Postavschik:", bx, y, 7, fontBold)
  text(`${data.sellerName}, ${data.sellerAddress}`, bx + 60, y, 7)
  y -= 12
  text("Pokupatel:", bx, y, 7, fontBold)
  text(`${data.buyerName}, ${data.buyerAddress}`, bx + 60, y, 7)
  y -= 18

  // --- Items table ---
  const tw = 515
  const cols = [30, 230, 40, 35, 50, 60, 70]
  const headers = ["N", "Tovary (raboty, uslugi)", "Kol-vo", "Ed.", "NDS", "Cena", "Summa"]

  // Header row
  page.drawRectangle({ x: bx, y: y - 14, width: tw, height: 14, color: rgb(0.95, 0.95, 0.95) })
  let cx = bx
  headers.forEach((h, i) => {
    text(h, cx + 3, y - 11, 6, fontBold)
    line(cx, y, cx, y - 14)
    cx += cols[i]
  })
  line(cx, y, cx, y - 14)
  line(bx, y, bx + tw, y)
  line(bx, y - 14, bx + tw, y - 14)
  y -= 14

  // Data rows
  data.items.forEach((item, idx) => {
    const rh = 12
    cx = bx
    const vals = [
      String(idx + 1),
      item.name.length > 45 ? item.name.substring(0, 42) + "..." : item.name,
      String(item.quantity),
      item.unit,
      item.vat,
      item.price.toFixed(2),
      item.total.toFixed(2),
    ]
    vals.forEach((v, i) => {
      text(v, cx + 3, y - 9, 7)
      line(cx, y, cx, y - rh)
      cx += cols[i]
    })
    line(cx, y, cx, y - rh)
    line(bx, y - rh, bx + tw, y - rh)
    y -= rh
  })

  // --- Totals ---
  y -= 10
  const totalItems = data.items.reduce((s, i) => s + i.quantity, 0)
  text(`Vsego naimenovanij ${totalItems}, na summu ${data.total.toFixed(2)} rub.`, bx, y, 8)
  y -= 16

  text("Itogo k oplate:", bx + 300, y, 12, fontBold)
  text(`${data.total.toFixed(2)}`, bx + 420, y, 12, fontBold)
  y -= 14
  text(`${Math.floor(data.total)} rub. ${((data.total % 1) * 100).toFixed(0).padStart(2, "0")} kop.`, bx, y, 8)
  y -= 30

  // --- Signature ---
  text("Individualnyj predprinimatel", bx, y, 8)
  line(bx + 150, y - 2, bx + 350, y - 2)
  const sellerShort = data.sellerName.replace(/^IP\s*/i, "")
  text(sellerShort, bx + 360, y, 8)

  return doc.save()
}
