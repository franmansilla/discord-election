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
import { Plus, Trash2, ArrowLeft, UserPlus, AlertCircle } from "lucide-react"
import Link from "next/link"

type CandidateForm = {
  name: string
  discordTag: string
  description: string
}

export default function NewElectionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [electionStatus, setElectionStatus] = useState<"DRAFT" | "ACTIVE">("DRAFT")
  const [candidates, setCandidates] = useState<CandidateForm[]>([
    { name: "", discordTag: "", description: "" },
  ])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return }
    if (status === "authenticated" && !session.user.isAdmin) router.push("/")
  }, [session, status, router])

  function addCandidate() {
    setCandidates([...candidates, { name: "", discordTag: "", description: "" }])
  }

  function removeCandidate(i: number) {
    setCandidates(candidates.filter((_, idx) => idx !== i))
  }

  function updateCandidate(i: number, field: keyof CandidateForm, value: string) {
    setCandidates(candidates.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim()) { setError("El titulo es obligatorio"); return }
    if (!startDate || !endDate) { setError("Las fechas son obligatorias"); return }
    if (new Date(endDate) <= new Date(startDate)) { setError("La fecha de cierre debe ser posterior al inicio"); return }
    const validCandidates = candidates.filter(c => c.name.trim())
    if (validCandidates.length < 2) { setError("Debes agregar al menos 2 candidatos"); return }

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
        candidates: validCandidates,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? "Error al crear la eleccion")
      setSubmitting(false)
      return
    }

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
            <ArrowLeft className="w-4 h-4 mr-1" />
            Admin
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
          <CardHeader>
            <CardTitle className="text-white text-base">Informacion de la eleccion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-white/70">Titulo *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Eleccion de moderadores 2025"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70">Descripcion</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripcion opcional de la eleccion..."
                rows={3}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-white/70">Fecha de inicio *</Label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  min={minDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white/10 border-white/20 text-white focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70">Fecha de cierre *</Label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  min={startDate || minDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white/10 border-white/20 text-white focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70">Estado inicial</Label>
              <div className="flex gap-3">
                {(["DRAFT", "ACTIVE"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setElectionStatus(s)}
                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                      electionStatus === s
                        ? s === "ACTIVE"
                          ? "bg-green-500/20 border-green-500 text-green-300"
                          : "bg-yellow-500/20 border-yellow-500 text-yellow-300"
                        : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    {s === "DRAFT" ? "Borrador (publicar luego)" : "Activar ahora"}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white text-base">Candidatos</CardTitle>
            <Button
              type="button"
              onClick={addCandidate}
              variant="ghost"
              size="sm"
              className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {candidates.map((c, i) => (
              <div key={i} className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm font-medium">Candidato {i + 1}</span>
                  {candidates.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeCandidate(i)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-white/50 text-xs">Nombre *</Label>
                    <Input
                      value={c.name}
                      onChange={(e) => updateCandidate(i, "name", e.target.value)}
                      placeholder="Nombre"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-9 text-sm focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/50 text-xs">Discord tag</Label>
                    <Input
                      value={c.discordTag}
                      onChange={(e) => updateCandidate(i, "discordTag", e.target.value)}
                      placeholder="usuario#1234"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-9 text-sm focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-white/50 text-xs">Descripcion / Propuesta</Label>
                  <Textarea
                    value={c.description}
                    onChange={(e) => updateCandidate(i, "description", e.target.value)}
                    placeholder="¿Por que votar por este candidato?"
                    rows={2}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 text-sm focus:border-indigo-500"
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              onClick={addCandidate}
              variant="ghost"
              className="w-full border border-dashed border-white/20 text-white/40 hover:text-white hover:bg-white/5 hover:border-white/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar candidato
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href="/admin" className="flex-1">
            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creando...
              </span>
            ) : "Crear eleccion"}
          </Button>
        </div>
      </form>
    </div>
  )
}
