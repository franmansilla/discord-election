"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ElectionCard } from "@/components/ElectionCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, LayoutDashboard, Vote, Users, BarChart3, ShieldAlert } from "lucide-react"

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

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return }
    if (status === "authenticated" && !session.user.isAdmin) { router.push("/"); return }
  }, [session, status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/elections")
      .then((r) => r.json())
      .then((data) => { setElections(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status])

  if (status === "loading" || (status === "authenticated" && !session.user.isAdmin)) {
    return <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white">Acceso restringido</h2>
      </div>
    )
  }

  const stats = {
    total: elections.length,
    active: elections.filter(e => e.status === "ACTIVE").length,
    totalVotes: elections.reduce((acc, e) => acc + (e._count?.votes ?? 0), 0),
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white">Panel de administracion</h1>
          </div>
          <p className="text-white/50 text-sm">Gestionas todas las elecciones del sitio</p>
        </div>
        <Link href="/admin/elections/new">
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
            <Plus className="w-4 h-4" />
            Nueva eleccion
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { icon: BarChart3, label: "Elecciones totales", value: stats.total, color: "text-indigo-400" },
          { icon: Vote, label: "Elecciones activas", value: stats.active, color: "text-green-400" },
          { icon: Users, label: "Votos totales", value: stats.totalVotes, color: "text-yellow-400" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl bg-white/5 border border-white/10 p-5 flex items-center gap-4">
            <Icon className={`w-8 h-8 ${color}`} />
            <div>
              <p className="text-white/50 text-xs">{label}</p>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map(i => <div key={i} className="h-52 rounded-xl bg-white/5 animate-pulse" />)}
        </div>
      ) : elections.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <Vote className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No hay elecciones creadas.</p>
          <Link href="/admin/elections/new">
            <Button variant="ghost" className="mt-4 text-indigo-400 hover:text-indigo-300">
              Crear la primera
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {["ACTIVE", "DRAFT", "CLOSED"].map((s) => {
            const filtered = elections.filter(e => e.status === s)
            if (!filtered.length) return null
            const labels = { ACTIVE: "Activas", DRAFT: "Borradores", CLOSED: "Cerradas" }
            return (
              <section key={s} className="mb-8">
                <h2 className="text-lg font-semibold text-white/80 mb-3 flex items-center gap-2">
                  {s === "ACTIVE" && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
                  {labels[s as keyof typeof labels]}
                  <Badge variant="outline" className="text-xs text-white/40 border-white/20">{filtered.length}</Badge>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(e => <ElectionCard key={e.id} election={e} showAdmin />)}
                </div>
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}
