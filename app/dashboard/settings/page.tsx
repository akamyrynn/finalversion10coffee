"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Plus, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [quickComments, setQuickComments] = useState<string[]>([])
  const [newComment, setNewComment] = useState("")

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || "")
      setPhone(user.user_metadata?.phone || "")

      // Load settings
      supabase
        .from("client_settings")
        .select("*")
        .eq("client_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setQuickComments(data.quick_comments || [])
          }
        })
    }
  }, [user, supabase])

  async function handleSaveProfile() {
    if (!user) return
    setLoading(true)

    const { error } = await supabase
      .from("client_profiles")
      .update({ full_name: fullName, phone })
      .eq("id", user.id)

    if (error) {
      toast.error("Ошибка при сохранении")
    } else {
      toast.success("Профиль обновлён")
    }
    setLoading(false)
  }

  async function handleAddComment() {
    if (!newComment.trim() || !user) return

    const updated = [...quickComments, newComment.trim()]
    setQuickComments(updated)
    setNewComment("")

    await supabase
      .from("client_settings")
      .update({ quick_comments: updated })
      .eq("client_id", user.id)
  }

  async function handleRemoveComment(index: number) {
    if (!user) return

    const updated = quickComments.filter((_, i) => i !== index)
    setQuickComments(updated)

    await supabase
      .from("client_settings")
      .update({ quick_comments: updated })
      .eq("client_id", user.id)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
        <p className="text-muted-foreground">
          Управление профилем и настройками
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Профиль</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="mt-1.5" />
          </div>
          <div>
            <Label>ФИО</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Телефон</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Сохранить
          </Button>
        </CardContent>
      </Card>

      {/* Quick comments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Быстрые комментарии</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Сохранённые комментарии для быстрого выбора при оформлении заказа
          </p>

          {quickComments.length > 0 && (
            <div className="space-y-2">
              {quickComments.map((comment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-muted rounded-md"
                >
                  <span className="text-sm flex-1">{comment}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveComment(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Новый комментарий"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            />
            <Button variant="outline" onClick={handleAddComment}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
