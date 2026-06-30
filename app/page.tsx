"use client"

import { useSession, signIn } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type Election = {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  status: "DRAFT" | "ACTIVE" | "CLOSED"
  voteMode: "FULL_LIST" | "SPLIT"
  resultsRevealed: boolean
  lists: { id: string; status: string; members: { id: string }[] }[]
  _count: { votes: number }
}

const statusStyle = (s: string) => {
  const base = "padding:4px 11px;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:0.04em;white-space:nowrap;"
  if (s === "ACTIVE") return base + "background:rgba(52,211,153,0.15);color:#6ee7b7;border:1px solid rgba(52,211,153,0.3);"
  if (s === "DRAFT") return base + "background:rgba(251,191,36,0.15);color:#fcd34d;border:1px solid rgba(251,191,36,0.3);"
  return base + "background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.55);border:1px solid rgba(255,255,255,0.15);"
}

const statusLabel = (s: string) => s === "ACTIVE" ? "● ACTIVA" : s === "DRAFT" ? "● INSCRIPCIÓN" : "● CERRADA"

export default function HomePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/elections").then(r => r.json()).then(d => {
      setElections(Array.isArray(d) ? d : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const candidateCount = (e: Election) => e.lists.reduce((acc, l) => acc + l.members.length, 0)

  const ctaLabel = (e: Election) => {
    if (e.status === "ACTIVE") return "Votar"
    if (e.status === "CLOSED" && e.resultsRevealed) return "Ver resultados"
    return "Ver candidatos"
  }

  const ctaRoute = (e: Election) => {
    if (e.status === "ACTIVE") return `/vote/${e.id}`
    if (e.status === "CLOSED" && e.resultsRevealed) return `/results/${e.id}`
    return `/vote/${e.id}`
  }

  const isPrimary = (e: Election) => e.status === "ACTIVE"

  const dateRange = (e: Election) => {
    const start = format(new Date(e.startDate), "d MMM", { locale: es })
    const end = format(new Date(e.endDate), "d MMM yyyy", { locale: es })
    return `${start} — ${end}`
  }

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 32px 0" }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
          color: "#a5b4fc", padding: "5px 13px", borderRadius: 999,
          fontSize: 12, fontWeight: 600, marginBottom: 18,
        }}>⬡ Sistema de elecciones para Discord</div>
        <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 12px", color: "#fff" }}>
          Elecciones del servidor
        </h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", margin: 0, maxWidth: 560, lineHeight: 1.5 }}>
          Participá en las votaciones de la comunidad. Tu voto es anónimo, verificable y definitivo.
        </p>
        {!session && (
          <button onClick={() => signIn("discord")} style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginTop: 24,
            background: "linear-gradient(135deg,#6366f1,#7c3aed)", border: "none",
            color: "#fff", fontWeight: 600, fontSize: 15, padding: "12px 24px",
            borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
          }}>
            <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "currentColor" }}>
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.103.129 18.117a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            Iniciar sesion con Discord
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 20 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 220, borderRadius: 18, background: "rgba(255,255,255,0.05)", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : elections.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.3)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🗳️</div>
          <p style={{ fontSize: 16 }}>No hay elecciones disponibles aun.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 20 }}>
          {elections.map(e => (
            <div key={e.id} style={{
              background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 18, padding: 22, display: "flex", flexDirection: "column", gap: 16,
              transition: "transform .15s, border-color .15s",
            }}
              onMouseEnter={ev => {
                (ev.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"
                ;(ev.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)"
                ;(ev.currentTarget as HTMLElement).style.transform = "translateY(-3px)"
              }}
              onMouseLeave={ev => {
                (ev.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"
                ;(ev.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"
                ;(ev.currentTarget as HTMLElement).style.transform = "none"
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, lineHeight: 1.3, color: "#fff" }}>{e.title}</h3>
                <span style={statusStyle(e.status) as React.CSSProperties}>{statusLabel(e.status)}</span>
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>🗓 {dateRange(e)}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{
                  padding: "4px 11px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                  background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)",
                }}>{e.voteMode === "FULL_LIST" ? "Lista completa" : "Voto dividido"}</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{candidateCount(e)} candidatos</span>
              </div>
              <button onClick={() => router.push(ctaRoute(e))} style={{
                border: isPrimary(e) ? "none" : "1px solid rgba(255,255,255,0.14)",
                cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 14,
                padding: "12px", borderRadius: 11, marginTop: "auto",
                background: isPrimary(e) ? "linear-gradient(135deg,#6366f1,#7c3aed)" : "rgba(255,255,255,0.05)",
                color: "#fff",
                boxShadow: isPrimary(e) ? "0 6px 18px rgba(99,102,241,0.3)" : "none",
              }}
                onMouseEnter={ev => (ev.currentTarget as HTMLElement).style.filter = "brightness(1.12)"}
                onMouseLeave={ev => (ev.currentTarget as HTMLElement).style.filter = "none"}
              >{ctaLabel(e)}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
