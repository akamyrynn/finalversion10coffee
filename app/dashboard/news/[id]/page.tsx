import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { formatDate } from "@/lib/utils/format"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { News } from "@/types"

interface Props {
  params: Promise<{ id: string }>
}

function renderContent(content: string) {
  // Try parsing as Lexical JSON
  try {
    const parsed = JSON.parse(content)
    if (parsed?.root?.children) {
      return (
        <div className="space-y-4">
          {parsed.root.children.map((node: { type: string; children?: { text?: string; format?: number }[] }, i: number) => {
            if (node.type === "paragraph" && node.children) {
              const text = node.children.map((c) => c.text || "").join("")
              if (!text.trim()) return <br key={i} />
              return <p key={i}>{text}</p>
            }
            if (node.type === "heading" && node.children) {
              const text = node.children.map((c) => c.text || "").join("")
              return <h3 key={i} className="text-lg font-bold">{text}</h3>
            }
            return null
          })}
        </div>
      )
    }
  } catch {
    // Not JSON — render as plain text
  }
  return <p className="whitespace-pre-wrap">{content}</p>
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: item } = await supabase
    .from("news")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .single()

  if (!item) notFound()

  const news = item as News

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/news"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-neutral-400 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Назад к новостям
      </Link>

      {/* Cover */}
      {news.cover_image && (
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-neutral-100">
          <img
            src={news.cover_image}
            alt={news.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Title + date */}
      <div>
        <h1 className="text-[28px] font-black text-neutral-900 tracking-tight">
          {news.title}
        </h1>
        {news.published_at && (
          <p className="text-[12px] text-neutral-400 mt-2">
            {formatDate(news.published_at)}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="text-[14px] text-neutral-700 leading-relaxed">
        {renderContent(news.content)}
      </div>
    </div>
  )
}
