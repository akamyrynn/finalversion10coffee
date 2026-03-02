import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "10coffee — Оптовая платформа кофе и чая",
  description:
    "B2B платформа для оптовой закупки кофе, чая и аксессуаров. Удобный личный кабинет для оптовых клиентов.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Root layout is minimal — each route group handles its own <html>/<body>
  // This prevents conflicts with Payload CMS which renders its own <html>
  return children
}
