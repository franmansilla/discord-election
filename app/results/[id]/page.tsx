"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"

type Member = { id: string; position: number; role: string | null; user: { name: string | null; image: string | null }; memberVoteCount: number }
type ListResult = { id: string; name: string; listVoteCount: number; members: Member[]; percentage: number }
type Election = { id: string; title: string; description: string | null; endDate: string; resultsRevealed: boolean }

const BAR_COLORS = ["linear-gradient(90deg,#fbbf24,#f59e0b)", "linear-gradient(90deg,#6366f1,#8b5cf6)", "linear-gradient(90deg,#94a3b8,#64748b)"]
const DOT_COLORS = ["#34d399","#60a5fa","#f87171","#a78bfa","#fb923c","#22d3ee"]

function AvatarEl({ image, name, size = 34, gradient = "linear-gradient(135deg,#6366f1,#8b5cf6)" }: { image: string | null; name: string | null; size?: number; gradient?: string }) {
  const initials = name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?"
  if (image) return <img src={image} alt={name ?? ""} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: Math.round(size * 0.38), color: "#fff" }}>
      {initials}
    </div>
  )
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [results, setResults] = useState<ListResult[]>([])
  const [election, setElection] = useState<Election | null>(null)
  const [totalVotes, setTotalVotes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/results/${id}`).then(async r => {
      if (!r.ok) { const d = await r.json(); setError(d.error); setLoading(false); return }
      return r.json()
    }).then(data => {
      if (!data) return
      setElection(data.election)
      setResults(data.results ?? [])
      setTotalVotes(data.totalVotes ?? 0)
      setLoading(false)
    }).catch(() => { setError("Error al cargar resultados"); setLoading(false) })
  }, [id])

  if (loading) return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 32px" }}>
      {[1,2,3].map(i => <div key={i} style={{ height: 100, borderRadius: 16, background: "rgba(255,255,255,0.05)", marginBottom: 16 }} />)}
    </div>
  )

  if (error) return (
    <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: "0 32px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Resultados no disponibles</h2>
      <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>{error}</p>
      <button onClick={() => router.push("/")} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontWeight: 600, fontSize: 14, padding: "11px 22px", borderRadius: 11, cursor: "pointer", fontFamily: "inherit" }}>Volver al inicio</button>
    </div>
  )

  const participation = totalVotes > 0 ? `${totalVotes} votos emitidos` : "Sin votos"

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 32px 80px" }}>
      <div onClick={() => router.push("/")} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.5)", cursor: "pointer", marginBottom: 22 }}>
        ← Volver a elecciones
      </div>

      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 8px", color: "#fff" }}>Resultados finales</h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", margin: 0 }}>{election?.title} · {participation}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {results.map((r, i) => {
          const isWinner = i === 0
          const dotColor = DOT_COLORS[i % DOT_COLORS.length]
          const barColor = BAR_COLORS[Math.min(i, 2)]
          return (
            <div key={r.id}
              className={isWinner ? "glow-winner" : ""}
              style={{
                position: "relative",
                background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                borderRadius: 16, padding: 22,
                border: isWinner ? "1px solid rgba(250,204,21,0.5)" : "1px solid rgba(255,255,255,0.1)",
              }}>
              {isWinner && (
                <div style={{ position: "absolute", top: -12, left: 24, display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#3a2c00", fontWeight: 700, fontSize: 12, padding: "5px 12px", borderRadius: 999, boxShadow: "0 6px 16px rgba(250,204,21,0.4)" }}>
                  👑 Ganador
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingTop: isWinner ? 8 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 17, flexShrink: 0,
                    background: isWinner ? "linear-gradient(135deg,#fbbf24,#f59e0b)" : "rgba(255,255,255,0.08)",
                    color: isWinner ? "#3a2c00" : "rgba(255,255,255,0.7)",
                  }}>#{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 11, height: 11, borderRadius: "50%", background: dotColor, display: "inline-block" }} />
                      {r.name}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                      {r.members.map(m => m.user.name).join(" · ")}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: isWinner ? "#fbbf24" : "#fff" }}>{r.percentage ?? 0}%</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{r.listVoteCount} votos</div>
                </div>
              </div>
              <div style={{ height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${r.percentage ?? 0}%`, borderRadius: 999, background: barColor, transition: "width 1s ease" }} />
              </div>
              {r.members.length > 0 && (
                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  {r.members.map((m, mi) => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 12px" }}>
                      <AvatarEl image={m.user.image} name={m.user.name} size={28} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{m.user.name}</div>
                        {m.role && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{m.role}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 32, textAlign: "center" }}>
        <button onClick={() => router.push("/")} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontWeight: 600, fontSize: 14, padding: "11px 22px", borderRadius: 11, cursor: "pointer", fontFamily: "inherit" }}>Volver al inicio</button>
      </div>
    </div>
  )
}
