"use client"

import { useSession, signIn } from "next-auth/react"
import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Vote, CheckCircle2, Lock, AlertCircle, Calendar } from "lucide-react"
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
  candidates: Candidate[]
  resultsRevealed: boolean
}

export default function VotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()

  const [election, setElection] = useState<Election | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/elections/${id}`).then((r) => r.json()),
      fetch(`/api/elections/${id}/vote`).then((r) => r.json()),
    ]).then(([electionData, voteData]) => {
      setElection(electionData)
      setHasVoted(voteData.hasVoted ?? false)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  async function submitVote() {
    if (!selected) return
    setSubmitting(true)
    setError(null)

    const res = await fetch(`/api/elections/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId: selected }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? "Error al votar")
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setHasVoted(true)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="space-y-4">
          <div className="h-8 bg-white/10 rounded animate-pulse" />
          <div className="h-48 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (!election) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-white/60">
        Eleccion no encontrada.
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <Lock className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Necesitas iniciar sesion</h2>
        <p className="text-white/60 mb-6">Debes conectar tu cuenta de Discord para poder votar.</p>
        <Button onClick={() => signIn("discord")} className="bg-indigo-600 hover:bg-indigo-500">
          Iniciar sesion con Discord
        </Button>
      </div>
    )
  }

  if (election.status !== "ACTIVE") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">
          {election.status === "DRAFT" ? "Esta eleccion aun no comenzo" : "Esta eleccion ya cerro"}
        </h2>
        {election.resultsRevealed && (
          <Button onClick={() => router.push(`/results/${id}`)} className="mt-4 bg-indigo-600 hover:bg-indigo-500">
            Ver resultados
          </Button>
        )}
      </div>
    )
  }

  if (hasVoted || success) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Voto registrado</h2>
        <p className="text-white/60 mb-6">Tu voto fue contabilizado correctamente. Los resultados se revelan cuando el administrador lo decida.</p>
        <Button onClick={() => router.push("/")} variant="outline" className="border-white/20 text-white hover:bg-white/10">
          Volver al inicio
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30 mb-3">
          Eleccion activa
        </Badge>
        <h1 className="text-3xl font-bold text-white mb-2">{election.title}</h1>
        {election.description && <p className="text-white/60">{election.description}</p>}
        <p className="text-white/40 text-sm mt-2 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          Cierra: {format(new Date(election.endDate), "dd MMM yyyy HH:mm", { locale: es })}
        </p>
      </div>

      {error && (
        <Alert className="mb-4 bg-red-500/10 border-red-500/30 text-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3 mb-8">
        <p className="text-white/60 text-sm font-medium">Selecciona un candidato:</p>
        {election.candidates.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c.id)}
            className={`w-full text-left rounded-xl border p-4 transition-all ${
              selected === c.id
                ? "bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500"
                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
            }`}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-white/10">
                <AvatarImage src={c.avatar ?? undefined} />
                <AvatarFallback className="bg-indigo-700 text-white text-sm">
                  {c.name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{c.name}</span>
                  {c.discordTag && (
                    <span className="text-white/40 text-xs">{c.discordTag}</span>
                  )}
                </div>
                {c.description && (
                  <p className="text-white/50 text-sm mt-0.5 line-clamp-2">{c.description}</p>
                )}
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                selected === c.id ? "border-indigo-400 bg-indigo-500" : "border-white/30"
              }`}>
                {selected === c.id && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </div>
          </button>
        ))}
      </div>

      <Button
        onClick={submitVote}
        disabled={!selected || submitting}
        size="lg"
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-12"
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Enviando voto...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Vote className="w-5 h-5" />
            Confirmar voto
          </span>
        )}
      </Button>
      <p className="text-center text-white/30 text-xs mt-3">
        Esta accion es irreversible. Solo puedes votar una vez.
      </p>
    </div>
  )
}
