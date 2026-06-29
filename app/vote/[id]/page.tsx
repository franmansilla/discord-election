"use client"

import { useSession, signIn } from "next-auth/react"
import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Vote, CheckCircle2, Lock, AlertCircle, Calendar, Users, Trophy, UserPlus } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

type Member = {
  id: string
  position: number
  role: string | null
  proposal: string | null
  user: { name: string | null; image: string | null }
}

type CandidateList = {
  id: string
  name: string
  status: "OPEN" | "COMPLETE"
  members: Member[]
}

type Election = {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  status: "DRAFT" | "ACTIVE" | "CLOSED"
  voteMode: "FULL_LIST" | "SPLIT"
  resultsRevealed: boolean
  lists: CandidateList[]
}

export default function VotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()

  const [election, setElection] = useState<Election | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [myMembership, setMyMembership] = useState<{ listId: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // FULL_LIST mode
  const [selectedList, setSelectedList] = useState<string | null>(null)
  // SPLIT mode
  const [selectedPos1, setSelectedPos1] = useState<string | null>(null)
  const [selectedPos2, setSelectedPos2] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/elections/${id}`).then(r => r.json()),
      fetch(`/api/elections/${id}/vote`).then(r => r.json()),
      fetch(`/api/elections/${id}/lists`).then(r => r.json()),
    ]).then(([electionData, voteData, listsData]) => {
      const lists = Array.isArray(listsData) ? listsData : []
      setElection({ ...electionData, lists })
      setHasVoted(voteData.hasVoted ?? false)
      if (session?.user?.id) {
        const myList = lists.find((l: CandidateList) =>
          l.members.some((m: Member) => m.user && session.user.id)
        )
        if (myList) setMyMembership({ listId: myList.id })
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id, session])

  async function submitVote() {
    setSubmitting(true)
    setError(null)

    let body: Record<string, unknown>
    if (election?.voteMode === "FULL_LIST") {
      if (!selectedList) { setError("Seleccioná una lista"); setSubmitting(false); return }
      body = { listId: selectedList }
    } else {
      if (!selectedPos1 || !selectedPos2) { setError("Seleccioná un candidato para cada posicion"); setSubmitting(false); return }
      body = { pos1: selectedPos1, pos2: selectedPos2 }
    }

    const res = await fetch(`/api/elections/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "Error al votar"); setSubmitting(false); return }
    setSuccess(true)
    setHasVoted(true)
    setSubmitting(false)
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-4">
      <div className="h-8 bg-white/10 rounded animate-pulse" />
      <div className="h-48 bg-white/10 rounded animate-pulse" />
    </div>
  )

  if (!election) return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-white/60">Eleccion no encontrada.</div>

  if (status === "unauthenticated") return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <Lock className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Necesitas iniciar sesion</h2>
      <p className="text-white/60 mb-6">Conecta tu cuenta de Discord para votar o postularte.</p>
      <Button onClick={() => signIn("discord")} className="bg-indigo-600 hover:bg-indigo-500">
        Iniciar sesion con Discord
      </Button>
    </div>
  )

  if (hasVoted || success) return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">Voto registrado</h2>
      <p className="text-white/60 mb-6">Tu voto fue contabilizado. Los resultados se revelan cuando el admin lo decida.</p>
      <Button onClick={() => router.push("/")} variant="outline" className="border-white/20 text-white hover:bg-white/10">Volver al inicio</Button>
    </div>
  )

  const completeLists = election.lists.filter(l => l.status === "COMPLETE")
  const openLists = election.lists.filter(l => l.status === "OPEN")
  const canVote = election.status === "ACTIVE"
  const canRegister = election.status !== "CLOSED" && election.status !== "ACTIVE"
  const allPos1 = election.lists.flatMap(l => l.members.filter(m => m.position === 1))
  const allPos2 = election.lists.flatMap(l => l.members.filter(m => m.position === 2))

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Badge variant="outline" className={`mb-3 ${
          election.status === "ACTIVE" ? "bg-green-500/20 text-green-300 border-green-500/30" :
          election.status === "DRAFT" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
          "bg-gray-500/20 text-gray-300 border-gray-500/30"
        }`}>
          {election.status === "ACTIVE" ? "Votacion abierta" : election.status === "DRAFT" ? "Inscripcion abierta" : "Cerrada"}
        </Badge>
        <h1 className="text-3xl font-bold text-white mb-2">{election.title}</h1>
        {election.description && <p className="text-white/60">{election.description}</p>}
        <div className="flex gap-4 mt-2 text-white/40 text-sm">
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Inicio: {format(new Date(election.startDate), "dd MMM yyyy HH:mm", { locale: es })}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Cierre: {format(new Date(election.endDate), "dd MMM yyyy HH:mm", { locale: es })}</span>
        </div>
        <p className="text-white/40 text-xs mt-1">
          Modo de voto: <span className="text-indigo-300">{election.voteMode === "FULL_LIST" ? "Lista completa" : "Voto dividido"}</span>
        </p>
      </div>

      {error && (
        <Alert className="mb-4 bg-red-500/10 border-red-500/30 text-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* VOTING UI */}
      {canVote && (
        <>
          {election.voteMode === "FULL_LIST" ? (
            <div className="space-y-3 mb-6">
              <p className="text-white/70 font-medium">Seleccioná una lista:</p>
              {completeLists.length === 0 && (
                <p className="text-white/40 text-sm py-8 text-center">No hay listas completas para votar.</p>
              )}
              {completeLists.map(list => (
                <button key={list.id} onClick={() => setSelectedList(list.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    selectedList === list.id ? "bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500" : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-white text-lg">{list.name}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedList === list.id ? "border-indigo-400 bg-indigo-500" : "border-white/30"}`}>
                      {selectedList === list.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {list.members.map(m => (
                      <div key={m.id} className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={m.user.image ?? undefined} />
                          <AvatarFallback className="bg-indigo-700 text-white text-xs">{m.user.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white text-sm font-medium">{m.user.name}</p>
                          {m.role && <p className="text-white/40 text-xs">{m.role}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6 mb-6">
              <p className="text-white/70 font-medium">Voto dividido — elegí un candidato para cada posicion:</p>
              <div>
                <p className="text-white/50 text-sm mb-2">Posicion 1:</p>
                <div className="space-y-2">
                  {allPos1.map(m => (
                    <button key={m.id} onClick={() => setSelectedPos1(m.id)}
                      className={`w-full text-left rounded-lg border p-3 flex items-center gap-3 transition-all ${
                        selectedPos1 === m.id ? "bg-indigo-600/20 border-indigo-500" : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}>
                      <Avatar className="h-8 w-8"><AvatarImage src={m.user.image ?? undefined} /><AvatarFallback className="bg-indigo-700 text-white text-xs">{m.user.name?.[0]}</AvatarFallback></Avatar>
                      <div><p className="text-white font-medium">{m.user.name}</p>{m.role && <p className="text-white/40 text-xs">{m.role}</p>}</div>
                      <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPos1 === m.id ? "border-indigo-400 bg-indigo-500" : "border-white/30"}`}>
                        {selectedPos1 === m.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-white/50 text-sm mb-2">Posicion 2:</p>
                <div className="space-y-2">
                  {allPos2.map(m => (
                    <button key={m.id} onClick={() => setSelectedPos2(m.id)}
                      className={`w-full text-left rounded-lg border p-3 flex items-center gap-3 transition-all ${
                        selectedPos2 === m.id ? "bg-indigo-600/20 border-indigo-500" : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}>
                      <Avatar className="h-8 w-8"><AvatarImage src={m.user.image ?? undefined} /><AvatarFallback className="bg-indigo-700 text-white text-xs">{m.user.name?.[0]}</AvatarFallback></Avatar>
                      <div><p className="text-white font-medium">{m.user.name}</p>{m.role && <p className="text-white/40 text-xs">{m.role}</p>}</div>
                      <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPos2 === m.id ? "border-indigo-400 bg-indigo-500" : "border-white/30"}`}>
                        {selectedPos2 === m.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Button onClick={submitVote} disabled={submitting} size="lg" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-12">
            {submitting ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enviando...</span>
              : <span className="flex items-center gap-2"><Vote className="w-5 h-5" />Confirmar voto</span>}
          </Button>
          <p className="text-center text-white/30 text-xs mt-3">Accion irreversible. Solo podes votar una vez.</p>
        </>
      )}

      {/* REGISTRATION / LISTS VIEW */}
      {!canVote && (
        <div className="space-y-6">
          {canRegister && !myMembership && (
            <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/30 p-5">
              <h3 className="text-white font-semibold mb-1 flex items-center gap-2"><UserPlus className="w-4 h-4 text-indigo-400" />Postulate como candidato</h3>
              <p className="text-white/50 text-sm mb-3">Podes crear una nueva lista o unirte a una existente.</p>
              <div className="flex gap-2 flex-wrap">
                <Link href={`/elections/${id}/register`}>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">Crear lista</Button>
                </Link>
              </div>
            </div>
          )}

          {completeLists.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-green-400" />Listas completas ({completeLists.length})</h3>
              <div className="space-y-3">
                {completeLists.map(list => <ListCard key={list.id} list={list} electionId={id} myMembership={myMembership} canRegister={canRegister} />)}
              </div>
            </div>
          )}

          {openLists.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-yellow-400" />Listas buscando segundo candidato ({openLists.length})</h3>
              <div className="space-y-3">
                {openLists.map(list => <ListCard key={list.id} list={list} electionId={id} myMembership={myMembership} canRegister={canRegister} />)}
              </div>
            </div>
          )}

          {election.lists.length === 0 && (
            <div className="text-center py-12 text-white/30">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Todavia no hay listas inscriptas.</p>
            </div>
          )}

          {election.status === "CLOSED" && election.resultsRevealed && (
            <Link href={`/results/${id}`}>
              <Button className="w-full bg-yellow-600 hover:bg-yellow-500 text-white"><Trophy className="w-4 h-4 mr-2" />Ver resultados</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function ListCard({ list, electionId, myMembership, canRegister }: {
  list: CandidateList
  electionId: string
  myMembership: { listId: string } | null
  canRegister: boolean
}) {
  const isMyList = myMembership?.listId === list.id

  return (
    <div className={`rounded-xl border p-4 ${isMyList ? "bg-indigo-500/10 border-indigo-500/30" : "bg-white/5 border-white/10"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-white">{list.name}</span>
        <div className="flex items-center gap-2">
          {isMyList && <Badge variant="outline" className="text-xs text-indigo-300 border-indigo-500/40">Tu lista</Badge>}
          <Badge variant="outline" className={`text-xs ${list.status === "COMPLETE" ? "text-green-300 border-green-500/30" : "text-yellow-300 border-yellow-500/30"}`}>
            {list.status === "COMPLETE" ? "Completa" : "Buscando 2do candidato"}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {list.members.map(m => (
          <div key={m.id} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={m.user.image ?? undefined} />
              <AvatarFallback className="bg-indigo-700 text-white text-xs">{m.user.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{m.user.name}</p>
              {m.role && <p className="text-white/40 text-xs truncate">{m.role}</p>}
            </div>
          </div>
        ))}
        {list.status === "OPEN" && (
          <div className="flex items-center gap-2 bg-white/5 border border-dashed border-white/20 rounded-lg p-2">
            {canRegister && !myMembership ? (
              <Link href={`/elections/${electionId}/register?join=${list.id}`} className="flex items-center gap-2 w-full">
                <div className="h-8 w-8 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center shrink-0">
                  <UserPlus className="w-3.5 h-3.5 text-white/40" />
                </div>
                <span className="text-white/40 text-sm">Unirme</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <div className="h-8 w-8 rounded-full border-2 border-dashed border-white/20 shrink-0" />
                <span className="text-white/30 text-sm">Vacante</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
