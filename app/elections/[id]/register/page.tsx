"use client"

import { useSession, signIn } from "next-auth/react"
import { useEffect, useState, use, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

type CandidateList = {
  id: string
  name: string
  status: "OPEN" | "COMPLETE"
  members: { id: string; position: number; role: string | null; user: { name: string | null; image: string | null } }[]
}

function ImageUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(value)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setUploading(true)
    setUploadError(null)
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    const data = await res.json()
    if (!res.ok) { setUploadError(data.error ?? "Error al subir"); setUploading(false); return }
    setPreview(data.url)
    onChange(data.url)
    setUploading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />

      {preview ? (
        <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)" }}>
          <img src={preview} alt="Imagen de campaña" style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", opacity: 0, transition: "opacity .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0"}>
            <button type="button" onClick={() => inputRef.current?.click()} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>
              Cambiar
            </button>
            <button type="button" onClick={() => { setPreview(""); onChange("") }} style={{ background: "rgba(248,113,113,0.2)", border: "1px solid rgba(248,113,113,0.4)", color: "#f87171", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          style={{
            border: "2px dashed rgba(99,102,241,0.35)", borderRadius: 12, padding: "32px 20px",
            textAlign: "center", cursor: "pointer", transition: "all .15s",
            background: "rgba(99,102,241,0.05)",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.6)"; (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.08)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.35)"; (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.05)" }}
        >
          {uploading ? (
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
              <div style={{ width: 28, height: 28, border: "2px solid rgba(99,102,241,0.3)", borderTop: "2px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
              Subiendo imagen...
            </div>
          ) : (
            <>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🖼️</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)", margin: "0 0 4px" }}>Subí tu imagen de campaña</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>JPG, PNG, WEBP · máx 5 MB · arrastrá o hacé clic</p>
            </>
          )}
        </div>
      )}
      {uploadError && <p style={{ fontSize: 12, color: "#f87171", marginTop: 6 }}>⚠️ {uploadError}</p>}
    </div>
  )
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
  const [campaignImage, setCampaignImage] = useState("")
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
    <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: "0 32px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Necesitas iniciar sesión</h2>
      <button onClick={() => signIn("discord")} style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)", border: "none", color: "#fff", fontWeight: 600, fontSize: 15, padding: "12px 24px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" }}>
        Iniciar sesión con Discord
      </button>
    </div>
  )

  async function handleCreate() {
    if (!listName.trim()) { setError("El nombre de la lista es obligatorio"); return }
    setSubmitting(true)
    const res = await fetch(`/api/elections/${electionId}/lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listName, role, proposal, campaignImage }),
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
      body: JSON.stringify({ role, proposal, campaignImage }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSubmitting(false); return }
    router.push(`/vote/${electionId}`)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 11, padding: "13px 15px", color: "#fff", fontSize: 14, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box",
  }
  const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.65)", marginBottom: 8 }
  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 14,
    padding: "11px", borderRadius: 10, transition: "all .15s",
    background: active ? "linear-gradient(135deg,#6366f1,#7c3aed)" : "transparent",
    color: active ? "#fff" : "rgba(255,255,255,0.55)",
  })

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "48px 32px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <Link href={`/vote/${electionId}`} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 9, textDecoration: "none" }}>← Volver</Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>Postulate como candidato</h1>
      </div>

      {session?.user && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "14px 16px", marginBottom: 24 }}>
          {session.user.image ? (
            <img src={session.user.image} alt="" style={{ width: 40, height: 40, borderRadius: "50%", boxShadow: "0 0 0 2px rgba(99,102,241,0.5)" }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff" }}>{session.user.name?.[0]}</div>
          )}
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>{session.user.name}</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>Tu cuenta de Discord</p>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: 5, borderRadius: 14, marginBottom: 24 }}>
        <button onClick={() => setMode("create")} style={tabBtn(mode === "create")}>Crear lista nueva</button>
        <button onClick={() => setMode("join")} disabled={openLists.length === 0} style={{ ...tabBtn(mode === "join"), opacity: openLists.length === 0 ? 0.4 : 1 }}>
          Unirme a una lista {openLists.length > 0 && `(${openLists.length})`}
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 12, padding: "12px 16px", color: "#fca5a5", fontSize: 14, marginBottom: 20 }}>⚠️ {error}</div>
      )}

      {/* CAMPOS COMUNES */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

        {mode === "create" && (
          <>
            <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 12, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16 }}>ℹ️</span>
              <span style={{ fontSize: 13, color: "#c7d2fe", lineHeight: 1.5 }}>Quedás en <b>Posición 1</b>. Otro candidato deberá unirse para completar la lista.</span>
            </div>
            <div>
              <label style={labelStyle}>Nombre de la lista *</label>
              <input value={listName} onChange={e => setListName(e.target.value)} placeholder="Ej. Lista Verde, Frente Unido..." style={inputStyle} />
            </div>
          </>
        )}

        {mode === "join" && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Listas abiertas · falta 1 integrante</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
              {openLists.map(list => {
                const sel = selectedListId === list.id
                return (
                  <div key={list.id} onClick={() => setSelectedListId(list.id)} style={{
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                    borderRadius: 12, padding: "13px 15px", transition: "all .15s",
                    background: sel ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.04)",
                    border: sel ? "1px solid rgba(99,102,241,0.6)" : "1px solid rgba(255,255,255,0.1)",
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, color: "#fff", flexShrink: 0 }}>
                      {list.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{list.name}</div>
                      {list.members[0] && (
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Posición 1 · {list.members[0].user.name}{list.members[0].role ? ` — ${list.members[0].role}` : ""}</div>
                      )}
                    </div>
                    <div style={{ marginLeft: "auto", width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: sel ? "2px solid #6366f1" : "2px solid rgba(255,255,255,0.25)", background: sel ? "rgba(99,102,241,0.15)" : "transparent", color: "#6366f1", fontSize: 10, flexShrink: 0 }}>
                      {sel ? "●" : ""}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <label style={labelStyle}>Tu rol en la lista</label>
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="Ej. Moderador principal, Co-moderador..." style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Tu propuesta</label>
          <textarea value={proposal} onChange={e => setProposal(e.target.value)} placeholder="Contá qué querés mejorar en el servidor..." rows={3} style={{ ...inputStyle, minHeight: 100, resize: "vertical", lineHeight: 1.5 }} />
        </div>

        <div>
          <label style={labelStyle}>Imagen de campaña <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>(opcional)</span></label>
          <ImageUploader value={campaignImage} onChange={setCampaignImage} />
        </div>

        <button
          onClick={mode === "create" ? handleCreate : handleJoin}
          disabled={submitting || (mode === "create" ? !listName.trim() : !selectedListId)}
          style={{
            width: "100%", background: "linear-gradient(135deg,#6366f1,#7c3aed)", border: "none",
            color: "#fff", fontWeight: 600, fontSize: 15, padding: "15px", borderRadius: 12,
            cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit",
            opacity: submitting ? 0.7 : 1,
            boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
          }}
        >
          {submitting ? "Enviando..." : mode === "create" ? "Crear lista y postularme" : "Unirme a la lista"}
        </button>
      </div>
    </div>
  )
}
