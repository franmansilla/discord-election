"use client"

import { useSession, signIn } from "next-auth/react"
import { useEffect, useState, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Users, UserPlus, AlertCircle } from "lucide-react"
import Link from "next/link"

type CandidateList = {
  id: string
  name: string
  status: "OPEN" | "COMPLETE"
  members: { id: string; position: number; role: string | null; user: { name: string | null; image: string | null } }[]
}

export default function RegisterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: electionId } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const joinListId = searchParams.get("join")

  const [mode, setMode] = useState<"create" | "join">(joinListId ? "join" : "create")
  const [openLists, setOpenLists] = useState<CandidateList[]>([])
  const [selectedListId, setSelectedListId] = useState<string | null>(joinListId)

  const [listName, setListName] = useState("")
  const [role, setRole] = useState("")
  const [proposal, setProposal] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/elections/${electionId}/lists`)
      .then(r => r.json())
      .then((data: CandidateList[]) => {
        setOpenLists(Array.isArray(data) ? data.filter(l => l.status === "OPEN") : [])
      })
  }, [electionId])

  if (status === "unauthenticated") return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <UserPlus className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Necesitas iniciar sesion</h2>
      <Button onClick={() => signIn("discord")} className="bg-indigo-600 hover:bg-indigo-500 mt-4">Iniciar sesion con Discord</Button>
    </div>
  )

  async function handleCreate() {
    if (!listName.trim()) { setError("El nombre de la lista es obligatorio"); return }
    setSubmitting(true)
    const res = await fetch(`/api/elections/${electionId}/lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listName, role, proposal }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSubmitting(false); return }
    router.push(`/vote/${electionId}`)
  }

  async function handleJoin() {
    if (!selectedListId) { setError("Seleccioná una lista"); return }
    setSubmitting(true)
    const res = await fetch(`/api/elections/${electionId}/lists/${selectedListId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, proposal }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSubmitting(false); return }
    router.push(`/vote/${electionId}`)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/vote/${electionId}`}>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-1" />Volver
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-white">Inscripcion de candidatura</h1>
      </div>

      {session?.user && (
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <Avatar className="h-10 w-10 ring-2 ring-indigo-500/40">
            <AvatarImage src={session.user.image ?? undefined} />
            <AvatarFallback className="bg-indigo-600 text-white">{session.user.name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-medium">{session.user.name}</p>
            <p className="text-white/40 text-xs">Tu cuenta de Discord</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button onClick={() => setMode("create")} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${mode === "create" ? "bg-indigo-600/20 border-indigo-500 text-indigo-300" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"}`}>
          Crear lista nueva
        </button>
        <button onClick={() => setMode("join")} disabled={openLists.length === 0} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${mode === "join" ? "bg-indigo-600/20 border-indigo-500 text-indigo-300" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"}`}>
          Unirme a una lista {openLists.length > 0 && `(${openLists.length})`}
        </button>
      </div>

      {error && (
        <Alert className="mb-4 bg-red-500/10 border-red-500/30 text-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {mode === "create" ? (
        <Card className="bg-white/5 border-white/10">
          <CardHeader><CardTitle className="text-white text-base">Nueva lista</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-white/70">Nombre de la lista *</Label>
              <Input value={listName} onChange={e => setListName(e.target.value)} placeholder="Ej: Lista Verde, Frente Unido..." className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-indigo-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70">Tu rol en la lista</Label>
              <Input value={role} onChange={e => setRole(e.target.value)} placeholder="Ej: Candidato a Presidente, Moderador..." className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-indigo-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70">Tu propuesta (opcional)</Label>
              <Textarea value={proposal} onChange={e => setProposal(e.target.value)} placeholder="¿Qué harías si ganás?" rows={3} className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-indigo-500" />
            </div>
            <p className="text-white/40 text-xs">Vas a quedar en la Posicion 1. Otro candidato deberá unirse como Posicion 2 para completar la lista.</p>
            <Button onClick={handleCreate} disabled={submitting || !listName.trim()} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
              {submitting ? "Creando..." : "Crear lista y postularme"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white/5 border-white/10">
          <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><Users className="w-4 h-4 text-yellow-400" />Listas buscando segundo candidato</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {openLists.length === 0 ? (
              <p className="text-white/40 text-center py-6 text-sm">No hay listas abiertas. Crea una nueva.</p>
            ) : (
              <div className="space-y-2">
                {openLists.map(list => (
                  <button key={list.id} onClick={() => setSelectedListId(list.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-all ${selectedListId === list.id ? "bg-indigo-600/20 border-indigo-500" : "bg-white/5 border-white/10 hover:bg-white/10"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{list.name}</span>
                      <div className={`w-4 h-4 rounded-full border-2 ${selectedListId === list.id ? "border-indigo-400 bg-indigo-500" : "border-white/30"}`} />
                    </div>
                    {list.members[0] && (
                      <p className="text-white/40 text-xs mt-1">
                        Candidato 1: {list.members[0].user.name} {list.members[0].role && `— ${list.members[0].role}`}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-white/70">Tu rol en la lista</Label>
              <Input value={role} onChange={e => setRole(e.target.value)} placeholder="Ej: Candidato a Vice, Moderador..." className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-indigo-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70">Tu propuesta (opcional)</Label>
              <Textarea value={proposal} onChange={e => setProposal(e.target.value)} placeholder="¿Qué harías si ganás?" rows={3} className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-indigo-500" />
            </div>
            <Button onClick={handleJoin} disabled={submitting || !selectedListId} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
              {submitting ? "Uniéndome..." : "Unirme a la lista"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
