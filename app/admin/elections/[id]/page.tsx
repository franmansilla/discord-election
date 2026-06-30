"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type Member = {
  id: string
  position: number
  role: string | null
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
  _count: { votes: number }
}

const statusStyle: Record<string, React.CSSProperties> = {
  DRAFT:  { padding: "4px 11px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "rgba(251,191,36,0.15)", color: "#fcd34d", border: "1px solid rgba(251,191,36,0.3)" },
  ACTIVE: { padding: "4px 11px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "rgba(52,211,153,0.15)", color: "#6ee7b7", border: "1px solid rgba(52,211,153,0.3)" },
  CLOSED: { padding: "4px 11px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.15)" },
}

const DOT_COLORS = ["#34d399","#60a5fa","#f87171","#a78bfa","#fb923c","#22d3ee"]
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#34d399,#059669)",
  "linear-gradient(135deg,#60a5fa,#2563eb)",
  "linear-gradient(135deg,#f87171,#dc2626)",
  "linear-gradient(135deg,#a78bfa,#7c3aed)",
]

function AvatarEl({ image, name, size = 34 }: { image: string | null; name: string | null; size?: number }) {
  const initials = name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?"
  if (image) return <img src={image} alt={name ?? ""} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: Math.round(size * 0.38), color: "#fff" }}>
      {initials}
    </div>
  )
}

export default function ManageElectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()

  const [election, setElection] = useState<Election | null>(null)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<{ msg: string; ok: boolean } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return }
    if (status === "authenticated" && !session.user.isAdmin) { router.push("/"); return }
  }, [session, status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch(`/api/elections/${id}`)
      .then(r => r.json())
      .then(data => {
        setElection({ ...data, lists: data.lists ?? [] })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id, status])

  function notify(msg: string, ok = true) {
    setNotice({ msg, ok })
    setTimeout(() => setNotice(null), 4000)
  }

  async function changeStatus(newStatus: "DRAFT" | "ACTIVE" | "CLOSED") {
    setActionLoading(true)
    const res = await fetch(`/api/elections/${id}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) })
    if (res.ok) { setElection(prev => prev ? { ...prev, status: newStatus } : prev); notify("Estado actualizado") }
    else { const d = await res.json(); notify(d.error ?? "Error", false) }
    setActionLoading(false)
  }

  async function revealResults() {
    if (!confirm("¿Revelar los resultados?")) return
    setActionLoading(true)
    const res = await fetch(`/api/elections/${id}/reveal`, { method: "POST" })
    if (res.ok) { setElection(prev => prev ? { ...prev, resultsRevealed: true, status: "CLOSED" } : prev); notify("Resultados revelados") }
    else { const d = await res.json(); notify(d.error ?? "Error", false) }
    setActionLoading(false)
  }

  async function deleteElection() {
    if (!confirm("¿Eliminar esta elección? Se perderán todos los votos.")) return
    await fetch(`/api/elections/${id}`, { method: "DELETE" })
    router.push("/admin")
  }

  async function deleteList(listId: string) {
    if (!confirm("¿Eliminar esta lista?")) return
    const res = await fetch(`/api/elections/${id}/lists/${listId}`, { method: "PUT" })
    if (res.ok) { setElection(prev => prev ? { ...prev, lists: prev.lists.filter(l => l.id !== listId) } : prev); notify("Lista eliminada") }
    else { const d = await res.json(); notify(d.error ?? "Error", false) }
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ width: 32, height: 32, border: "2px solid rgba(99,102,241,0.4)", borderTop: "2px solid #6366f1", borderRadius: "50%" }} />
    </div>
  )

  if (!election) return <div style={{ textAlign: "center", padding: "80px 32px", color: "rgba(255,255,255,0.4)" }}>Elección no encontrada.</div>

  const totalCandidates = (election.lists ?? []).reduce((a, l) => a + (l.members?.length ?? 0), 0)
  const completeLists = (election.lists ?? []).filter(l => l.status === "COMPLETE")
  const openLists = (election.lists ?? []).filter(l => l.status === "OPEN")

  const btnBase: React.CSSProperties = { border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13, padding: "9px 16px", borderRadius: 10, transition: "all .15s", display: "inline-flex", alignItems: "center", gap: 6 }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 32px 80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button onClick={() => router.push("/admin")} style={{ ...btnBase, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}>← Admin</button>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{election.title}</h1>
        <span style={statusStyle[election.status]}>{election.status}</span>
      </div>

      {/* Notice */}
      {notice && (
        <div style={{ background: notice.ok ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${notice.ok ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`, borderRadius: 12, padding: "12px 16px", color: notice.ok ? "#6ee7b7" : "#fca5a5", fontSize: 14, marginBottom: 20 }}>
          {notice.msg}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Listas", value: (election.lists ?? []).length },
          { label: "Candidatos", value: totalCandidates },
          { label: "Votos", value: election._count?.votes ?? 0 },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px 20px" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Dates & mode */}
      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px 20px", marginBottom: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Inicio</div>
          <div style={{ fontSize: 13, color: "#fff" }}>{format(new Date(election.startDate), "dd MMM yyyy HH:mm", { locale: es })}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Cierre</div>
          <div style={{ fontSize: 13, color: "#fff" }}>{format(new Date(election.endDate), "dd MMM yyyy HH:mm", { locale: es })}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Modo de voto</div>
          <div style={{ fontSize: 13, color: "#a5b4fc" }}>{election.voteMode === "FULL_LIST" ? "Lista completa" : "Voto dividido"}</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Acciones</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {election.status === "DRAFT" && (
            <button onClick={() => changeStatus("ACTIVE")} disabled={actionLoading} style={{ ...btnBase, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", boxShadow: "0 6px 18px rgba(34,197,94,0.3)" }}>▶ Activar elección</button>
          )}
          {election.status === "ACTIVE" && (
            <button onClick={() => changeStatus("CLOSED")} disabled={actionLoading} style={{ ...btnBase, background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)", color: "#fb923c" }}>■ Cerrar votación</button>
          )}
          {!election.resultsRevealed && election.status !== "DRAFT" && (
            <button onClick={revealResults} disabled={actionLoading} style={{ ...btnBase, background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#3a2c00", boxShadow: "0 6px 18px rgba(251,191,36,0.3)" }}>🏆 Revelar resultados</button>
          )}
          {election.resultsRevealed && (
            <Link href={`/results/${election.id}`} style={{ ...btnBase, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", textDecoration: "none" }}>👁 Ver resultados</Link>
          )}
          <Link href={`/vote/${election.id}`} target="_blank" style={{ ...btnBase, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", textDecoration: "none" }}>🗳 Ver página de voto</Link>
          <button onClick={deleteElection} style={{ ...btnBase, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", marginLeft: "auto" }}>🗑 Eliminar</button>
        </div>
      </div>

      {/* Lists */}
      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Listas de candidatos ({(election.lists ?? []).length})</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Los candidatos se inscriben desde la página de voto</div>
        </div>

        {(election.lists ?? []).length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <p>No hay listas inscriptas aún.</p>
          </div>
        ) : (
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {(election.lists ?? []).map((list, li) => {
              const dotColor = DOT_COLORS[li % DOT_COLORS.length]
              return (
                <div key={list.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{list.name}</span>
                      <span style={{
                        padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                        background: list.status === "COMPLETE" ? "rgba(52,211,153,0.15)" : "rgba(251,191,36,0.15)",
                        color: list.status === "COMPLETE" ? "#6ee7b7" : "#fcd34d",
                        border: list.status === "COMPLETE" ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(251,191,36,0.3)",
                      }}>{list.status === "COMPLETE" ? "Completa" : "Abierta"}</span>
                    </div>
                    <button onClick={() => deleteList(list.id)} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>
                      Eliminar
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {(list.members ?? []).map((m, mi) => (
                      <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px" }}>
                        <AvatarEl image={m.user?.image ?? null} name={m.user?.name ?? null} size={34} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.user?.name ?? "—"}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Posición {m.position}{m.role ? ` · ${m.role}` : ""}</div>
                        </div>
                      </div>
                    ))}
                    {list.status === "OPEN" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 12px" }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", border: "2px dashed rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "rgba(255,255,255,0.3)", fontSize: 18 }}>+</div>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Vacante</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
