"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Election = {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  status: "DRAFT" | "ACTIVE" | "CLOSED"
  voteMode: "FULL_LIST" | "SPLIT"
  resultsRevealed: boolean
  lists: { id: string; members: { id: string }[] }[]
  _count: { votes: number }
}

type AuditVoter = { voterId: string; username: string; image: string | null; discordId: string; votedAt: string }

const statusBadge = (s: string): React.CSSProperties => {
  const base: React.CSSProperties = { padding: "4px 11px", borderRadius: 999, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", whiteSpace: "nowrap" }
  if (s === "ACTIVE") return { ...base, background: "rgba(52,211,153,0.15)", color: "#6ee7b7", border: "1px solid rgba(52,211,153,0.3)" }
  if (s === "DRAFT") return { ...base, background: "rgba(251,191,36,0.15)", color: "#fcd34d", border: "1px solid rgba(251,191,36,0.3)" }
  return { ...base, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.15)" }
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [adminTab, setAdminTab] = useState<"elections" | "audit">("elections")
  const [auditElectionId, setAuditElectionId] = useState<string | null>(null)
  const [auditData, setAuditData] = useState<AuditVoter[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [reveal, setReveal] = useState<Record<string, boolean>>({})
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return }
    if (status === "authenticated" && !session.user.isAdmin) { router.push("/"); return }
  }, [session, status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/elections").then(r => r.json()).then(data => {
      const list = Array.isArray(data) ? data : []
      setElections(list)
      const revealMap: Record<string, boolean> = {}
      list.forEach((e: Election) => { revealMap[e.id] = e.resultsRevealed })
      setReveal(revealMap)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [status])

  async function loadAudit(electionId: string) {
    setAuditLoading(true)
    setAuditElectionId(electionId)
    const res = await fetch(`/api/elections/${electionId}/audit`)
    const data = await res.json()
    setAuditData(data.voters ?? [])
    setAuditLoading(false)
  }

  async function toggleReveal(electionId: string) {
    const newVal = !reveal[electionId]
    setReveal(r => ({ ...r, [electionId]: newVal }))
    setUpdating(electionId)
    await fetch(`/api/elections/${electionId}/reveal`, { method: "POST" })
    setUpdating(null)
  }

  async function changeStatus(electionId: string, newStatus: string) {
    await fetch(`/api/elections/${electionId}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) })
    setElections(prev => prev.map(e => e.id === electionId ? { ...e, status: newStatus as Election["status"] } : e))
  }

  if (status === "loading") return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ width: 32, height: 32, border: "2px solid rgba(99,102,241,0.5)", borderTop: "2px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
    </div>
  )

  const totalVotes = elections.reduce((a, e) => a + (e._count?.votes ?? 0), 0)
  const activeCount = elections.filter(e => e.status === "ACTIVE").length
  const totalCandidates = elections.reduce((a, e) => a + e.lists.reduce((b, l) => b + l.members.length, 0), 0)

  const tabBtn = (active: boolean): React.CSSProperties => ({
    border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 14,
    padding: "9px 18px", borderRadius: 9, transition: "all .15s",
    background: active ? "linear-gradient(135deg,#6366f1,#7c3aed)" : "transparent",
    color: active ? "#fff" : "rgba(255,255,255,0.55)",
  })

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "48px 32px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 4px", color: "#fff" }}>Panel de administración</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0 }}>Gestioná todas las elecciones</p>
        </div>
        <Link href="/admin/elections/new" style={{
          background: "linear-gradient(135deg,#6366f1,#7c3aed)", border: "none", color: "#fff",
          fontWeight: 600, fontSize: 14, padding: "11px 20px", borderRadius: 11,
          textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
          boxShadow: "0 8px 22px rgba(99,102,241,0.35)",
        }}>+ Nueva elección</Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Votos totales", value: totalVotes, color: "#fff" },
          { label: "Elecciones activas", value: activeCount, color: "#34d399" },
          { label: "Candidatos registrados", value: totalCandidates, color: "#a5b4fc" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: 5, borderRadius: 13, marginBottom: 22, width: "fit-content" }}>
        <button onClick={() => setAdminTab("elections")} style={tabBtn(adminTab === "elections")}>Elecciones</button>
        <button onClick={() => setAdminTab("audit")} style={tabBtn(adminTab === "audit")}>Auditoría</button>
      </div>

      {/* Elections tab */}
      {adminTab === "elections" && (
        loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[1,2].map(i => <div key={i} style={{ height: 80, borderRadius: 16, background: "rgba(255,255,255,0.05)" }} />)}
          </div>
        ) : elections.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗳️</div>
            <p>No hay elecciones creadas aún.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {elections.map(e => {
              const on = !!reveal[e.id]
              const candidateCount = e.lists.reduce((a, l) => a + l.members.length, 0)
              return (
                <div key={e.id} style={{
                  background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 240 }}>
                    <span style={statusBadge(e.status)}>{e.status}</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{e.title}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                        {e.voteMode === "FULL_LIST" ? "Lista completa" : "Voto dividido"} · {e._count?.votes ?? 0} votos · {candidateCount} candidatos
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {/* Reveal toggle */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: "7px 12px", borderRadius: 10 }}>
                      Revelar resultados
                      <div onClick={() => !updating && toggleReveal(e.id)} style={{ width: 38, height: 22, borderRadius: 999, padding: 2, display: "flex", transition: "all .15s", cursor: "pointer", background: on ? "#6366f1" : "rgba(255,255,255,0.15)", justifyContent: on ? "flex-end" : "flex-start" }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff" }} />
                      </div>
                    </div>
                    {/* Status change */}
                    <select onChange={ev => changeStatus(e.id, ev.target.value)} value={e.status} style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
                      <option value="DRAFT" style={{ background: "#0d0e2a" }}>Borrador</option>
                      <option value="ACTIVE" style={{ background: "#0d0e2a" }}>Activa</option>
                      <option value="CLOSED" style={{ background: "#0d0e2a" }}>Cerrada</option>
                    </select>
                    <Link href={`/admin/elections/${e.id}`} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 13, padding: "8px 14px", borderRadius: 10, textDecoration: "none" }}>Editar</Link>
                    <button onClick={() => { setAdminTab("audit"); loadAudit(e.id) }} style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", fontSize: 13, padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" }}>Auditoría</button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Audit tab */}
      {adminTab === "audit" && (
        <div>
          {!auditElectionId ? (
            <div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>Seleccioná una elección para ver el registro de votantes:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {elections.map(e => (
                  <button key={e.id} onClick={() => loadAudit(e.id)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, fontFamily: "inherit", textAlign: "left" }}>
                    <span style={statusBadge(e.status)}>{e.status}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{e.title}</span>
                    <span style={{ marginLeft: "auto", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{e._count?.votes ?? 0} votos →</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Registro de votantes</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{elections.find(e => e.id === auditElectionId)?.title}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>🔒 El voto es secreto · solo se registra la participación</span>
                  <button onClick={() => { setAuditElectionId(null); setAuditData([]) }} style={{ fontSize: 12, color: "#a5b4fc", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>← Volver</button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr", padding: "12px 20px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div>Usuario</div><div>Discord ID</div><div style={{ textAlign: "right" }}>Fecha y hora</div>
              </div>
              {auditLoading ? (
                <div style={{ padding: "32px 20px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Cargando...</div>
              ) : auditData.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>No hay votos registrados aún.</div>
              ) : auditData.map((v, vi) => {
                const gradients = ["linear-gradient(135deg,#a78bfa,#7c3aed)","linear-gradient(135deg,#f472b6,#db2777)","linear-gradient(135deg,#22d3ee,#0891b2)","linear-gradient(135deg,#34d399,#059669)","linear-gradient(135deg,#fbbf24,#d97706)"]
                const grad = gradients[vi % gradients.length]
                const initials = v.username ? v.username.slice(0, 2).toUpperCase() : "?"
                const date = new Date(v.votedAt)
                const timeStr = `${date.getDate()} ${date.toLocaleString("es", { month: "short" })} · ${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`
                return (
                  <div key={v.voterId} style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr", padding: "13px 20px", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      {v.image ? (
                        <img src={v.image} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: grad, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#fff", flexShrink: 0 }}>{initials}</div>
                      )}
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{v.username}</div>
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: "'SF Mono',ui-monospace,monospace" }}>{v.discordId || "—"}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "right" }}>{timeStr}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
