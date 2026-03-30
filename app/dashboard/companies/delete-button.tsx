"use client"

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteCompany } from "@/lib/actions/companies"
import { toast } from "sonner"

export function DeleteCompanyButton({ companyId, companyName }: { companyId: string; companyName: string }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const result = await deleteCompany(companyId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Компания "${companyName}" удалена`)
    }
    setLoading(false)
    setConfirming(false)
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading} className="h-8 text-xs">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Да, удалить"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} className="h-8 text-xs">
          Отмена
        </Button>
      </div>
    )
  }

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => setConfirming(true)}>
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
