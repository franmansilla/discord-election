"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Vote, Trophy } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type Election = {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  status: "DRAFT" | "ACTIVE" | "CLOSED"
  resultsRevealed: boolean
  candidates: { id: string }[]
  _count?: { votes: number }
}

const statusConfig = {
  DRAFT: { label: "Borrador", className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  ACTIVE: { label: "Activa", className: "bg-green-500/20 text-green-300 border-green-500/30" },
  CLOSED: { label: "Cerrada", className: "bg-gray-500/20 text-gray-300 border-gray-500/30" },
}

export function ElectionCard({ election, showAdmin }: { election: Election; showAdmin?: boolean }) {
  const cfg = statusConfig[election.status]
  const start = new Date(election.startDate)
  const end = new Date(election.endDate)

  return (
    <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-white text-lg leading-tight">{election.title}</CardTitle>
          <Badge variant="outline" className={`shrink-0 text-xs ${cfg.className}`}>
            {cfg.label}
          </Badge>
        </div>
        {election.description && (
          <p className="text-white/60 text-sm mt-1 line-clamp-2">{election.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-1 text-xs text-white/50">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Inicio: {format(start, "dd MMM yyyy HH:mm", { locale: es })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Cierre: {format(end, "dd MMM yyyy HH:mm", { locale: es })}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-white/70">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4 text-indigo-400" />
            {election.candidates.length} candidatos
          </span>
          {election._count && (
            <span className="flex items-center gap-1">
              <Vote className="w-4 h-4 text-indigo-400" />
              {election._count.votes} votos
            </span>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          {election.status === "ACTIVE" && (
            <Link href={`/vote/${election.id}`} className="flex-1">
              <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
                <Vote className="w-4 h-4 mr-2" />
                Votar
              </Button>
            </Link>
          )}
          {election.resultsRevealed && (
            <Link href={`/results/${election.id}`} className="flex-1">
              <Button size="sm" variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                <Trophy className="w-4 h-4 mr-2" />
                Resultados
              </Button>
            </Link>
          )}
          {showAdmin && (
            <Link href={`/admin/elections/${election.id}`}>
              <Button size="sm" variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10">
                Gestionar
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
