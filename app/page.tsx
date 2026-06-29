"use client"

import { useSession, signIn } from "next-auth/react"
import { useEffect, useState } from "react"
import { ElectionCard } from "@/components/ElectionCard"
import { Button } from "@/components/ui/button"
import { Vote, Shield, Users, BarChart3 } from "lucide-react"

type Election = {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  status: "DRAFT" | "ACTIVE" | "CLOSED"
  resultsRevealed: boolean
  candidates: { id: string }[]
  _count: { votes: number }
}

export default function HomePage() {
  const { data: session } = useSession()
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/elections")
      .then((r) => r.json())
      .then((data) => {
        setElections(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const active = elections.filter((e) => e.status === "ACTIVE")
  const closed = elections.filter((e) => e.status === "CLOSED")

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mb-6">
          <Vote className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Elecciones para tu<br />
          <span className="text-indigo-400">servidor de Discord</span>
        </h1>
        <p className="text-white/60 text-lg max-w-xl mx-auto mb-8">
          Votaciones seguras, transparentes y auditables. Cada usuario vota una sola vez.
        </p>

        {!session && (
          <Button
            onClick={() => signIn("discord")}
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 text-base h-12 px-8"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.103.129 18.117a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            Iniciar sesion con Discord
          </Button>
        )}
      </div>

      {!session && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
          {[
            { icon: Shield, title: "Un voto por usuario", desc: "Cada cuenta de Discord puede votar una sola vez por eleccion." },
            { icon: Users, title: "Panel de auditoria", desc: "El admin puede ver quienes votaron, sin revelar a quien." },
            { icon: BarChart3, title: "Resultados controlados", desc: "El admin elige cuando revelar los resultados finales." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl bg-white/5 border border-white/10 p-5 text-center">
              <Icon className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-1">{title}</h3>
              <p className="text-white/50 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Elecciones activas
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {active.map((e) => <ElectionCard key={e.id} election={e} />)}
              </div>
            </section>
          )}

          {closed.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white/70 mb-4">Elecciones cerradas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {closed.map((e) => <ElectionCard key={e.id} election={e} />)}
              </div>
            </section>
          )}

          {elections.length === 0 && (
            <div className="text-center py-20 text-white/40">
              <Vote className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No hay elecciones disponibles aun.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
