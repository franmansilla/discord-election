"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertCircle, Users, Vote } from "lucide-react"
import Link from "next/link"

export default function NewElectionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [electionStatus, setElectionStatus] = useState<"DRAFT" | "ACTIVE">("DRAFT")
  const [voteMode, setVoteMode] = useState<"FULL_LIST" | "SPLIT">("FULL_LIST")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return }
    if (status === "authenticated" && !session.user.isAdmin) router.push("/")
  }, [session, status, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim()) { setError("El titulo es obligatorio"); return }
    if (!startDate || !endDate) { setError("Las fechas son obligatorias"); return }
    if (new Date(endDate) <= new Date(startDate)) { setError("La fecha de cierre debe ser posterior al inicio"); return }

    setSubmitting(true)
    const res = await fetch("/api/elections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        startDate,
        endDate,
        status: electionStatus,
        voteMode,
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "Error al crear"); setSubmitting(false); return }
    router.push(`/admin/elections/${data.id}`)
  }

  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  const minDate = now.toISOString().slice(0, 16)

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-1" />Admin
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">Nueva eleccion</h1>
      </div>

      {error && (
        <Alert className="mb-6 bg-red-500/10 border-red-500/30 text-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader><CardTitle className="text-white text-base">Informacion de la eleccion</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-white/70">Titulo *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Eleccion de moderadores 2025"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-indigo-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70">Descripcion</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripcion opcional..." rows={3}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-white/70">Inicio *</Label>
                <Input type="datetime-local" value={startDate} min={minDate} onChange={e => setStartDate(e.target.value)}
                  className="bg-white/10 border-white/20 text-white focus:border-indigo-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70">Cierre *</Label>
                <Input type="datetime-local" value={endDate} min={startDate || minDate} onChange={e => setEndDate(e.target.value)}
                  className="bg-white/10 border-white/20 text-white focus:border-indigo-500" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70">Estado inicial</Label>
              <div className="flex gap-3">
                {(["DRAFT", "ACTIVE"] as const).map(s => (
                  <button key={s} type="button" onClick={() => setElectionStatus(s)}
                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                      electionStatus === s
                        ? s === "ACTIVE" ? "bg-green-500/20 border-green-500 text-green-300" : "bg-yellow-500/20 border-yellow-500 text-yellow-300"
                        : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                    }`}>
                    {s === "DRAFT" ? "Borrador" : "Activar ahora"}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader><CardTitle className="text-white text-base">Modo de votacion</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <button type="button" onClick={() => setVoteMode("FULL_LIST")}
              className={`w-full text-left rounded-lg border p-4 transition-all ${voteMode === "FULL_LIST" ? "bg-indigo-600/20 border-indigo-500" : "bg-white/5 border-white/10 hover:bg-white/10"}`}>
              <div className="flex items-center gap-3">
                <Vote className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-white font-medium">Lista completa</p>
                  <p className="text-white/50 text-sm">Se vota por la lista entera. Los 2 candidatos ganan o pierden juntos.</p>
                </div>
                <div className={`ml-auto w-5 h-5 rounded-full border-2 shrink-0 ${voteMode === "FULL_LIST" ? "border-indigo-400 bg-indigo-500" : "border-white/30"}`} />
              </div>
            </button>
            <button type="button" onClick={() => setVoteMode("SPLIT")}
              className={`w-full text-left rounded-lg border p-4 transition-all ${voteMode === "SPLIT" ? "bg-indigo-600/20 border-indigo-500" : "bg-white/5 border-white/10 hover:bg-white/10"}`}>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-yellow-400 shrink-0" />
                <div>
                  <p className="text-white font-medium">Voto dividido</p>
                  <p className="text-white/50 text-sm">El votante elige un candidato para Posicion 1 y otro para Posicion 2 independientemente.</p>
                </div>
                <div className={`ml-auto w-5 h-5 rounded-full border-2 shrink-0 ${voteMode === "SPLIT" ? "border-indigo-400 bg-indigo-500" : "border-white/30"}`} />
              </div>
            </button>
          </CardContent>
        </Card>

        <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-4 text-sm text-indigo-300">
          Los candidatos se inscriben ellos mismos en la pagina de la eleccion una vez creada.
          No es necesario agregarlos manualmente.
        </div>

        <div className="flex gap-3">
          <Link href="/admin" className="flex-1">
            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white">
            {submitting ? "Creando..." : "Crear eleccion"}
          </Button>
        </div>
      </form>
    </div>
  )
}
