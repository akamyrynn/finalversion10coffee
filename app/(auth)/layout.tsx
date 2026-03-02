import { Coffee, Sparkles } from "lucide-react"
import Link from "next/link"
import { HtmlWrapper } from "@/components/shared/html-wrapper"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <HtmlWrapper>
    <div className="flex min-h-screen">
      {/* Left side — premium dark branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-coffee-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(239,191,4,0.12),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(111,85,64,0.15),_transparent_60%)]" />

        {/* Decorative */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-gold-400/5 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-48 h-48 rounded-full bg-coffee-600/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-lg shadow-gold-400/20">
              <Coffee className="h-5 w-5 text-coffee-950" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              10coffee
            </span>
          </Link>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight text-white">
              Оптовая платформа
              <br />
              <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
                для вашего бизнеса
              </span>
            </h1>
            <p className="text-lg text-coffee-300 max-w-md leading-relaxed">
              Премиальный кофе и чай от лучших обжарщиков.
              Удобный личный кабинет для оптовых клиентов.
            </p>
            <div className="flex gap-8 pt-4 border-t border-white/[0.06]">
              {[
                { value: "200+", label: "Сортов" },
                { value: "1000+", label: "Партнёров" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-coffee-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-coffee-700">
            &copy; {new Date().getFullYear()} 10coffee. Все права защищены.
          </p>
        </div>
      </div>

      {/* Right side — auth form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12 bg-coffee-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600">
              <Coffee className="h-4 w-4 text-coffee-950" />
            </div>
            <span className="text-xl font-bold tracking-tight text-coffee-900">
              10coffee
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
    </HtmlWrapper>
  )
}
