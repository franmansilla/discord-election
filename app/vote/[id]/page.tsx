"use client"

import { useSession, signIn } from "next-auth/react"
import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

type Member = {
  id: string
  position: number
  role: string | null
  proposal: string | null
  campaignImage: string | null
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

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#34d399,#059669)",
  "linear-gradient(135deg,#60a5fa,#2563eb)",
  "linear-gradient(135deg,#f87171,#dc2626)",
  "linear-gradient(135deg,#a78bfa,#7c3aed)",
  "linear-gradient(135deg,#fb923c,#ea580c)",
  "linear-gradient(135deg,#22d3ee,#0891b2)",
]
const DOT_COLORS = ["#34d399","#60a5fa","#f87171","#a78bfa","#fb923c","#22d3ee"]

function initials(name: string | null) {
  if (!name) return "?"
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

function AvatarEl({ image, name, size = 42, gradient }: { image: string | null; name: string | null; size?: number; gradient?: string }) {
  if (image) return <img src={image} alt={name ?? ""} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: gradient ?? "linear-gradient(135deg,#6366f1,#8b5cf6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: Math.round(size * 0.35), color: "#fff",
    }}>{initials(name)}</div>
  )
}

export default function VotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()

  const [election, setElection] = useState<Election | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voted, setVoted] = useState(false)
  const [selectedList, setSelectedList] = useState<string | null>(null)
  const [selectedPos1, setSelectedPos1] = useState<string | null>(null)
  const [selectedPos2, setSelectedPos2] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/elections/${id}`).then(r => r.json()),
      fetch(`/api/elections/${id}/vote`).then(r => r.json()),
      fetch(`/api/elections/${id}/lists`).then(r => r.json()),
    ]).then(([electionData, voteData, listsData]) => {
      setElection({ ...electionData, lists: Array.isArray(listsData) ? listsData : [] })
      setHasVoted(voteData.hasVoted ?? false)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  async function submitVote() {
    setSubmitting(true)
    setError(null)
    let body: Record<string, unknown>
    if (election?.voteMode === "FULL_LIST") {
      if (!selectedList) { setError("Seleccioná una lista"); setSubmitting(false); return }
      body = { listId: selectedList }
    } else {
      if (!selectedPos1 || !selectedPos2) { setError("Seleccioná un candidato para cada posición"); setSubmitting(false); return }
      body = { pos1: selectedPos1, pos2: selectedPos2 }
    }
    const res = await fetch(`/api/elections/${id}/vote`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "Error al votar"); setSubmitting(false); return }
    setVoted(true); setHasVoted(true); setSubmitting(false)
  }

  if (loading) return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 32px 0" }}>
      {[1,2,3].map(i => <div key={i} style={{ height: 80, borderRadius: 16, background: "rgba(255,255,255,0.05)", marginBottom: 16 }} />)}
    </div>
  )
  if (!election) return <div style={{ textAlign: "center", padding: "80px 32px", color: "rgba(255,255,255,0.4)" }}>Elección no encontrada.</div>

  if (status === "unauthenticated") return (
    <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: "0 32px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Necesitas iniciar sesión</h2>
      <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>Conecta tu cuenta de Discord para votar o postularte.</p>
      <button onClick={() => signIn("discord")} style={{
        background: "linear-gradient(135deg,#6366f1,#7c3aed)", border: "none", color: "#fff",
        fontWeight: 600, fontSize: 15, padding: "12px 24px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
        boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
      }}>Iniciar sesión con Discord</button>
    </div>
  )

  if (hasVoted || voted) return (
    <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: "0 32px" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Voto registrado</h2>
      <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>Tu voto fue contabilizado. Los resultados se revelan cuando el admin lo decida.</p>
      <button onClick={() => router.push("/")} style={{
        background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff",
        fontWeight: 600, fontSize: 14, padding: "11px 22px", borderRadius: 11, cursor: "pointer", fontFamily: "inherit",
      }}>Volver al inicio</button>
    </div>
  )

  const completeLists = election.lists.filter(l => l.status === "COMPLETE")
  const openLists = election.lists.filter(l => l.status === "OPEN")
  const canVote = election.status === "ACTIVE"
  const allPos1 = election.lists.flatMap(l => l.members.filter(m => m.position === 1))
  const allPos2 = election.lists.flatMap(l => l.members.filter(m => m.position === 2))
  const canConfirm = election.voteMode === "FULL_LIST" ? !!selectedList : (!!selectedPos1 && !!selectedPos2)

  const confirmBtnStyle: React.CSSProperties = {
    width: "100%", marginTop: 28, border: "none", fontFamily: "inherit",
    fontWeight: 700, fontSize: 16, padding: "17px", borderRadius: 14, transition: "all .15s",
    cursor: canConfirm ? "pointer" : "not-allowed",
    background: canConfirm ? "linear-gradient(135deg,#6366f1,#7c3aed)" : "rgba(255,255,255,0.06)",
    color: canConfirm ? "#fff" : "rgba(255,255,255,0.35)",
    boxShadow: canConfirm ? "0 10px 30px rgba(99,102,241,0.4)" : "none",
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 32px 80px" }}>
      <div onClick={() => router.push("/")} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.5)", cursor: "pointer", marginBottom: 22 }}>
        ← Volver a elecciones
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{
          padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em",
          background: election.status === "ACTIVE" ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.08)",
          color: election.status === "ACTIVE" ? "#6ee7b7" : "rgba(255,255,255,0.55)",
          border: election.status === "ACTIVE" ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(255,255,255,0.15)",
        }}>● {election.status === "ACTIVE" ? "ACTIVA" : election.status === "DRAFT" ? "INSCRIPCIÓN" : "CERRADA"}</span>
        <span style={{ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}>
          {election.voteMode === "FULL_LIST" ? "Lista completa" : "Voto dividido"}
        </span>
      </div>

      <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 10px", color: "#fff" }}>{election.title}</h1>
      {election.description && <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", margin: "0 0 8px", lineHeight: 1.55 }}>{election.description}</p>}
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 36 }}>
        🗓 Cierra el {format(new Date(election.endDate), "d 'de' MMMM · HH:mm", { locale: es })}
      </div>

      {error && (
        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 12, padding: "12px 16px", color: "#fca5a5", fontSize: 14, marginBottom: 20 }}>
          ⚠️ {error}
        </div>
      )}

      {/* VOTING UI */}
      {canVote && (
        <>
          {election.voteMode === "FULL_LIST" ? (
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 18px" }}>
                Seleccioná una lista para votar
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {completeLists.map((list, li) => {
                  const sel = selectedList === list.id
                  const dotColor = DOT_COLORS[li % DOT_COLORS.length]
                  return (
                    <div key={list.id} onClick={() => setSelectedList(list.id)}
                      className={sel ? "glow-selected" : ""}
                      style={{
                        cursor: "pointer", background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)", borderRadius: 16, padding: 20, transition: "all .18s",
                        border: sel ? "1px solid rgba(99,102,241,0.7)" : "1px solid rgba(255,255,255,0.1)",
                      }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 12, height: 12, borderRadius: "50%", background: dotColor, boxShadow: `0 0 12px ${dotColor}` }} />
                          <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{list.name}</span>
                        </div>
                        <div style={{
                          width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                          border: sel ? "2px solid #6366f1" : "2px solid rgba(255,255,255,0.25)",
                          background: sel ? "rgba(99,102,241,0.15)" : "transparent", color: "#6366f1", fontSize: 11,
                        }}>{sel ? "●" : ""}</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {list.members.map((m, mi) => (
                          <div key={m.id} style={{ borderRadius: 12, overflow: "hidden", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            {m.campaignImage && (
                              <img src={m.campaignImage} alt="" style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }} />
                            )}
                            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12 }}>
                              <AvatarEl image={m.user.image} name={m.user.name} size={38} gradient={AVATAR_GRADIENTS[mi]} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.user.name}</div>
                                {m.role && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{m.role}</div>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {completeLists.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.35)" }}>No hay listas completas para votar aún.</div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 18px" }}>
                Voto dividido — elegí un candidato para cada posición
              </h2>
              {[
                { label: "Posición 1", members: allPos1, selected: selectedPos1, setSelected: setSelectedPos1 },
                { label: "Posición 2", members: allPos2, selected: selectedPos2, setSelected: setSelectedPos2 },
              ].map(({ label, members, selected, setSelected }) => (
                <div key={label} style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 10, fontWeight: 600 }}>{label}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {members.map((m, mi) => {
                      const sel = selected === m.id
                      return (
                        <div key={m.id} onClick={() => setSelected(m.id)} style={{
                          display: "flex", alignItems: "center", gap: 12, borderRadius: 12,
                          padding: "12px 16px", cursor: "pointer", transition: "all .15s",
                          background: sel ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.04)",
                          border: sel ? "1px solid rgba(99,102,241,0.6)" : "1px solid rgba(255,255,255,0.1)",
                        }}>
                          <AvatarEl image={m.user.image} name={m.user.name} size={38} gradient={AVATAR_GRADIENTS[mi]} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{m.user.name}</div>
                            {m.role && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{m.role}</div>}
                          </div>
                          <div style={{
                            marginLeft: "auto", width: 22, height: 22, borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            border: sel ? "2px solid #6366f1" : "2px solid rgba(255,255,255,0.25)",
                            background: sel ? "rgba(99,102,241,0.15)" : "transparent", color: "#6366f1", fontSize: 11,
                          }}>{sel ? "●" : ""}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button onClick={submitVote} disabled={submitting || !canConfirm} style={confirmBtnStyle}>
            {submitting ? "Enviando..." : canConfirm ? "Confirmar voto" : "Seleccioná una lista"}
          </button>
          <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "16px 0 0" }}>
            🔒 Solo podés votar una vez. Esta acción es irreversible.
          </p>
        </>
      )}

      {/* INSCRIPTION / VIEW MODE */}
      {!canVote && (
        <div>
          {election.status !== "CLOSED" && (
            <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 14, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>¿Querés postularte?</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 }}>Creá una lista o unite a una que busca segundo candidato.</p>
              </div>
              <Link href={`/elections/${id}/register`} style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)", border: "none", color: "#fff", fontWeight: 600, fontSize: 13, padding: "10px 18px", borderRadius: 10, textDecoration: "none", whiteSpace: "nowrap" }}>Postularme</Link>
            </div>
          )}
          {completeLists.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>🟢 Listas completas ({completeLists.length})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {completeLists.map((list, li) => <ListCard key={list.id} list={list} colorIndex={li} />)}
              </div>
            </div>
          )}
          {openLists.length > 0 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>🟡 Buscando segundo candidato ({openLists.length})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {openLists.map((list, li) => <ListCard key={list.id} list={list} colorIndex={li + 3} electionId={id} showJoin />)}
              </div>
            </div>
          )}
          {election.lists.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
              <p>Todavía no hay listas inscriptas.</p>
            </div>
          )}
          {election.status === "CLOSED" && election.resultsRevealed && (
            <button onClick={() => router.push(`/results/${id}`)} style={{ width: "100%", marginTop: 24, background: "linear-gradient(135deg,#fbbf24,#f59e0b)", border: "none", color: "#3a2c00", fontWeight: 700, fontSize: 15, padding: 14, borderRadius: 12, cursor: "pointer", fontFamily: "inherit" }}>
              🏆 Ver resultados finales
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ListCard({ list, colorIndex, electionId, showJoin }: { list: CandidateList; colorIndex: number; electionId?: string; showJoin?: boolean }) {
  const dotColor = DOT_COLORS[colorIndex % DOT_COLORS.length]
  return (
    <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: dotColor, boxShadow: `0 0 10px ${dotColor}` }} />
        <span style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>{list.name}</span>
        <span style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: list.status === "COMPLETE" ? "rgba(52,211,153,0.15)" : "rgba(251,191,36,0.15)", color: list.status === "COMPLETE" ? "#6ee7b7" : "#fcd34d", border: list.status === "COMPLETE" ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(251,191,36,0.3)" }}>
          {list.status === "COMPLETE" ? "Completa" : "Buscando 2do"}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {list.members.map((m, mi) => (
          <div key={m.id} style={{ borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {m.campaignImage && (
              <img src={m.campaignImage} alt="" style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
              <AvatarEl image={m.user.image} name={m.user.name} size={34} gradient={AVATAR_GRADIENTS[mi]} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.user.name}</div>
                {m.role && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{m.role}</div>}
              </div>
            </div>
          </div>
        ))}
        {showJoin && electionId && list.status === "OPEN" && (
          <Link href={`/elections/${electionId}/register?join=${list.id}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", background: "rgba(99,102,241,0.05)", border: "1px dashed rgba(99,102,241,0.3)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px dashed rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "rgba(255,255,255,0.4)", fontSize: 18 }}>+</div>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Unirme</span>
          </Link>
        )}
      </div>
    </div>
  )
}
