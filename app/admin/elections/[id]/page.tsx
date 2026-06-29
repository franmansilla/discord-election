"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft, Play, Square, Eye, Trash2, Users, Vote,
  AlertCircle, CheckCircle2, UserPlus, Trophy
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type Candidate = {
  id: string
  name: string
  discordTag: string | null
  description: string | null
  avatar: string | null
}

type Election = {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  status: "DRAFT" | "ACTIVE" | "CLOSED"
  resultsRevealed: boolean
  candidates: Candidate[]
  _count: { votes: number }
}

export default function ManageElectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()

  const [election, setElection] = useState<Election | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newCandidate, setNewCandidate] = useState({ name: "", discordTag: "", description: "" })
  const [addingCandidate, setAddingCandidate] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return }
    if (status === "authenticated" && !session.user.isAdmin) { router.push("/"); return }
  }, [session, status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch(`/api/elections/${id}`)
      .then(r => r.json())
      .then(data => { setElection(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id, status])

  function notify(msg: string, isError = false) {
    if (isError) { setError(msg); setSuccess(null) }
    else { setSuccess(msg); setError(null) }
    setTimeout(() => { setError(null); setSuccess(null) }, 4000)
  }

  async function changeStatus(newStatus: "DRAFT" | "ACTIVE" | "CLOSED") {
    setActionLoading(true)
    const res = await fetch(`/api/elections/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    const data = await res.json()
    if (res.ok) { setElection(prev => prev ? { ...prev, status: newStatus } : prev); notify("Estado actualizado") }
    else notify(data.error ?? "Error", true)
    setActionLoading(false)
  }

  async function revealResults() {
    if (!confirm("¿Revelar los resultados? Esta accion no se puede deshacer.")) return
    setActionLoading(true)
    const res = await fetch(`/api/elections/${id}/reveal`, { method: "POST" })
    const data = await res.json()
    if (res.ok) {
      setElection(prev => prev ? { ...prev, resultsRevealed: true, status: "CLOSED" } : prev)
      notify("Resultados revelados correctamente")
    } else notify(data.error ?? "Error", true)
    setActionLoading(false)
  }

  async function deleteElection() {
    if (!confirm("¿Eliminar esta eleccion? Esto eliminara todos los votos.")) return
    await fetch(`/api/elections/${id}`, { method: "DELETE" })
    router.push("/admin")
  }

  async function addCandidate() {
    if (!newCandidate.name.trim()) return
    setActionLoading(true)
    const res = await fetch(`/api/elections/${id}/candidates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCandidate),
    })
    const data = await res.json()
    if (res.ok) {
      setElection(prev => prev ? { ...prev, candidates: [...prev.candidates, data] } : prev)
      setNewCandidate({ name: "", discordTag: "", description: "" })
      setAddingCandidate(false)
      notify("Candidato agregado")
    } else notify(data.error ?? "Error", true)
    setActionLoading(false)
  }

  async function removeCandidate(candidateId: string) {
    if (!confirm("¿Eliminar este candidato?")) return
    const res = await fetch(`/api/elections/${id}/candidates`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId }),
    })
    if (res.ok) {
      setElection(prev => prev ? { ...prev, candidates: prev.candidates.filter(c => c.id !== candidateId) } : prev)
      notify("Candidato eliminado")
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!election) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center text-white/60">Eleccion no encontrada</div>
  )

  const statusCfg = {
    DRAFT: { label: "Borrador", cls: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
    ACTIVE: { label: "Activa", cls: "bg-green-500/20 text-green-300 border-green-500/30" },
    CLOSED: { label: "Cerrada", cls: "bg-gray-500/20 text-gray-300 border-gray-500/30" },
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Admin
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{election.title}</h1>
        </div>
        <Badge variant="outline" className={statusCfg[election.status].cls}>
          {statusCfg[election.status].label}
        </Badge>
      </div>

      {error && (
        <Alert className="mb-4 bg-red-500/10 border-red-500/30 text-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="mb-4 bg-green-500/10 border-green-500/30 text-green-300">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Candidatos", value: election.candidates.length, icon: Users },
          { label: "Votos", value: election._count.votes, icon: Vote },
          { label: "Resultados", value: election.resultsRevealed ? "Revelados" : "Ocultos", icon: Eye },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
            <Icon className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
            <p className="text-xs text-white/40">{label}</p>
            <p className="font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Dates */}
      <Card className="bg-white/5 border-white/10 mb-6">
        <CardContent className="pt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-white/40 text-xs mb-1">Inicio</p>
            <p className="text-white">{format(new Date(election.startDate), "dd MMM yyyy HH:mm", { locale: es })}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-1">Cierre</p>
            <p className="text-white">{format(new Date(election.endDate), "dd MMM yyyy HH:mm", { locale: es })}</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="bg-white/5 border-white/10 mb-6">
        <CardHeader>
          <CardTitle className="text-white text-base">Acciones</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {election.status === "DRAFT" && (
            <Button
              onClick={() => changeStatus("ACTIVE")}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-500 text-white gap-2"
            >
              <Play className="w-4 h-4" />
              Activar eleccion
            </Button>
          )}
          {election.status === "ACTIVE" && (
            <Button
              onClick={() => changeStatus("CLOSED")}
              disabled={actionLoading}
              variant="outline"
              className="border-orange-500/50 text-orange-300 hover:bg-orange-500/10 gap-2"
            >
              <Square className="w-4 h-4" />
              Cerrar votacion
            </Button>
          )}
          {(election.status === "CLOSED" || election.status === "ACTIVE") && !election.resultsRevealed && (
            <Button
              onClick={revealResults}
              disabled={actionLoading}
              className="bg-yellow-600 hover:bg-yellow-500 text-white gap-2"
            >
              <Trophy className="w-4 h-4" />
              Revelar resultados
            </Button>
          )}
          {election.resultsRevealed && (
            <Link href={`/results/${election.id}`}>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 gap-2">
                <Eye className="w-4 h-4" />
                Ver resultados
              </Button>
            </Link>
          )}
          <Link href={`/admin/elections/${election.id}/audit`}>
            <Button variant="outline" className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10 gap-2">
              <Users className="w-4 h-4" />
              Panel de auditoria
            </Button>
          </Link>
          {election.status === "ACTIVE" && (
            <Link href={`/vote/${election.id}`} target="_blank">
              <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10 gap-2">
                <Vote className="w-4 h-4" />
                Ver pagina de voto
              </Button>
            </Link>
          )}
          <Button
            onClick={deleteElection}
            variant="ghost"
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2 ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </Button>
        </CardContent>
      </Card>

      {/* Candidates */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-base">Candidatos ({election.candidates.length})</CardTitle>
          {election.status === "DRAFT" && (
            <Button
              onClick={() => setAddingCandidate(!addingCandidate)}
              variant="ghost"
              size="sm"
              className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {addingCandidate && (
            <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/30 p-4 space-y-3">
              <p className="text-indigo-300 text-sm font-medium">Nuevo candidato</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/50 text-xs">Nombre *</Label>
                  <Input
                    value={newCandidate.name}
                    onChange={e => setNewCandidate(p => ({ ...p, name: e.target.value }))}
                    placeholder="Nombre"
                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-white/50 text-xs">Discord tag</Label>
                  <Input
                    value={newCandidate.discordTag}
                    onChange={e => setNewCandidate(p => ({ ...p, discordTag: e.target.value }))}
                    placeholder="usuario#1234"
                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 h-9 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={addCandidate} disabled={actionLoading || !newCandidate.name.trim()} size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                  Agregar
                </Button>
                <Button onClick={() => setAddingCandidate(false)} variant="ghost" size="sm" className="text-white/60 hover:text-white">
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {election.candidates.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 p-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={c.avatar ?? undefined} />
                <AvatarFallback className="bg-indigo-700 text-white text-sm">
                  {c.name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{c.name}</p>
                {c.discordTag && <p className="text-white/40 text-xs">{c.discordTag}</p>}
                {c.description && <p className="text-white/50 text-xs mt-0.5 truncate">{c.description}</p>}
              </div>
              {election.status === "DRAFT" && (
                <Button
                  onClick={() => removeCandidate(c.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))}

          {election.candidates.length === 0 && (
            <p className="text-center text-white/30 text-sm py-6">No hay candidatos aun</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
