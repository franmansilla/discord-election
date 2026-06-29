"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Medal, Vote, Lock } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type Candidate = {
  id: string
  name: string
  discordTag: string | null
  description: string | null
  avatar: string | null
  voteCount: number
  percentage: number
}

type Election = {
  id: string
  title: string
  description: string | null
  endDate: string
  resultsRevealed: boolean
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [results, setResults] = useState<Candidate[]>([])
  const [election, setElection] = useState<Election | null>(null)
  const [totalVotes, setTotalVotes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/results/${id}`)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json()
          setError(d.error)
          setLoading(false)
          return
        }
        return r.json()
      })
      .then((data) => {
        if (!data) return
        setElection(data.election)
        setResults(data.results)
        setTotalVotes(data.totalVotes)
        setLoading(false)
      })
      .catch(() => {
        setError("Error al cargar resultados")
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-4">
        <div className="h-8 bg-white/10 rounded animate-pulse" />
        <div className="h-64 bg-white/10 rounded animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <Lock className="w-12 h-12 text-white/30 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Resultados no disponibles</h2>
        <p className="text-white/50 mb-6">{error}</p>
        <Button onClick={() => router.push("/")} variant="outline" className="border-white/20 text-white hover:bg-white/10">
          Volver al inicio
        </Button>
      </div>
    )
  }

  const winner = results[0]
  const rankIcons = [
    <Trophy key="1" className="w-5 h-5 text-yellow-400" />,
    <Medal key="2" className="w-5 h-5 text-gray-300" />,
    <Medal key="3" className="w-5 h-5 text-amber-600" />,
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 mb-3">
          Resultados oficiales
        </Badge>
        <h1 className="text-3xl font-bold text-white mb-2">{election?.title}</h1>
        {election?.description && <p className="text-white/60">{election.description}</p>}
        {election?.endDate && (
          <p className="text-white/40 text-sm mt-2">
            Cerrada el {format(new Date(election.endDate), "dd MMM yyyy HH:mm", { locale: es })}
          </p>
        )}
        <div className="flex items-center gap-1 text-white/50 text-sm mt-1">
          <Vote className="w-4 h-4" />
          <span>{totalVotes} votos totales</span>
        </div>
      </div>

      {winner && (
        <div className="rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border border-yellow-500/30 p-6 mb-6 text-center">
          <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
          <p className="text-yellow-300 text-sm font-medium mb-2">Ganador</p>
          <Avatar className="h-16 w-16 mx-auto mb-3 ring-4 ring-yellow-500/40">
            <AvatarImage src={winner.avatar ?? undefined} />
            <AvatarFallback className="bg-yellow-600 text-white text-xl">
              {winner.name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold text-white">{winner.name}</h2>
          {winner.discordTag && <p className="text-white/50 text-sm">{winner.discordTag}</p>}
          <p className="text-yellow-300 font-semibold mt-2">
            {winner.voteCount} votos ({winner.percentage}%)
          </p>
        </div>
      )}

      <div className="space-y-3">
        {results.map((c, i) => (
          <div key={c.id} className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-7 h-7 shrink-0">
                {rankIcons[i] ?? <span className="text-white/40 font-bold text-sm">#{i + 1}</span>}
              </div>
              <Avatar className="h-9 w-9">
                <AvatarImage src={c.avatar ?? undefined} />
                <AvatarFallback className="bg-indigo-700 text-white text-sm">
                  {c.name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-white">{c.name}</span>
                {c.discordTag && <span className="text-white/40 text-xs ml-2">{c.discordTag}</span>}
              </div>
              <span className="text-white font-bold shrink-0">{c.voteCount} votos</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${i === 0 ? "bg-yellow-400" : "bg-indigo-500"}`}
                  style={{ width: `${c.percentage}%` }}
                />
              </div>
              <span className="text-white/50 text-sm w-10 text-right">{c.percentage}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Button onClick={() => router.push("/")} variant="outline" className="border-white/20 text-white hover:bg-white/10">
          Volver al inicio
        </Button>
      </div>
    </div>
  )
}
