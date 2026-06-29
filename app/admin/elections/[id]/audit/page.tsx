"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { ArrowLeft, Users, Vote, Shield, Trophy, Eye, EyeOff } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type Voter = {
  voterId: string
  username: string
  avatar: string | null
  discordId: string
  votedAt: string
}

type ResultCandidate = {
  id: string
  name: string
  discordTag: string | null
  voteCount: number
}

type AuditData = {
  election: {
    id: string
    title: string
    status: string
    resultsRevealed: boolean
    _count: { votes: number }
  }
  voters: Voter[]
  totalVotes: number
  results: ResultCandidate[] | null
}

export default function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<AuditData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return }
    if (status === "authenticated" && !session.user.isAdmin) { router.push("/"); return }
  }, [session, status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch(`/api/elections/${id}/audit`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id, status])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center text-white/60">No se pudo cargar la auditoria</div>
  )

  const participation = data.election._count.votes > 0
    ? Math.round((data.totalVotes / data.election._count.votes) * 100)
    : 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/admin/elections/${id}`}>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Gestion
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Panel de auditoria</h1>
          <p className="text-white/40 text-sm">{data.election.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center gap-3">
          <Users className="w-8 h-8 text-indigo-400" />
          <div>
            <p className="text-white/40 text-xs">Usuarios que votaron</p>
            <p className="text-2xl font-bold text-white">{data.totalVotes}</p>
          </div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center gap-3">
          <Vote className="w-8 h-8 text-green-400" />
          <div>
            <p className="text-white/40 text-xs">Total votos registrados</p>
            <p className="text-2xl font-bold text-white">{data.election._count.votes}</p>
          </div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center gap-3">
          <Shield className="w-8 h-8 text-yellow-400" />
          <div>
            <p className="text-white/40 text-xs">Resultados</p>
            <p className="text-white font-bold">{data.election.resultsRevealed ? "Revelados" : "Ocultos"}</p>
          </div>
        </div>
      </div>

      {/* Results section (only if revealed) */}
      {data.results && (
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              Resultados
            </CardTitle>
            <Button
              onClick={() => setShowResults(!showResults)}
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              {showResults ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showResults ? "Ocultar" : "Mostrar"}
            </Button>
          </CardHeader>
          {showResults && (
            <CardContent className="space-y-2">
              {data.results.map((c, i) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 w-5 text-sm font-bold">#{i + 1}</span>
                    <span className="text-white font-medium">{c.name}</span>
                    {c.discordTag && <span className="text-white/40 text-xs">{c.discordTag}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${i === 0 ? "bg-yellow-400" : "bg-indigo-500"}`}
                        style={{ width: data.totalVotes > 0 ? `${(c.voteCount / data.totalVotes) * 100}%` : "0%" }}
                      />
                    </div>
                    <Badge variant="outline" className="border-white/20 text-white text-xs">
                      {c.voteCount} votos
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Voters table */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            Registro de votantes
            <span className="text-white/40 text-xs font-normal">(el voto en si es secreto)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.voters.length === 0 ? (
            <p className="text-center text-white/30 text-sm py-8">
              Nadie ha votado todavia
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/50">#</TableHead>
                  <TableHead className="text-white/50">Usuario</TableHead>
                  <TableHead className="text-white/50">Discord ID</TableHead>
                  <TableHead className="text-white/50">Fecha y hora del voto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.voters.map((v, i) => (
                  <TableRow key={v.voterId} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-white/40 text-sm">{i + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={v.avatar ? `https://cdn.discordapp.com/avatars/${v.discordId}/${v.avatar}.png` : undefined} />
                          <AvatarFallback className="bg-indigo-700 text-white text-xs">
                            {v.username[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-white text-sm">{v.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-white/40 text-xs font-mono">{v.discordId}</TableCell>
                    <TableCell className="text-white/60 text-sm">
                      {format(new Date(v.votedAt), "dd MMM yyyy HH:mm:ss", { locale: es })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
