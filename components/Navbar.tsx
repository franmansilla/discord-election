"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Shield, LogOut, LayoutDashboard } from "lucide-react"

export function Navbar() {
  const { data: session, status } = useSession()
  const router = useRouter()

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 40,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 32px",
      background: "rgba(10,11,26,0.6)",
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
    }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 18, color: "#fff",
          boxShadow: "0 6px 18px rgba(99,102,241,0.45)",
        }}>D</div>
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em", color: "#fff" }}>Discord Election</span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {status === "loading" ? (
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
        ) : session ? (
          <>
            {session.user.isAdmin && (
              <Link href="/admin" style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 13, fontWeight: 600, color: "#a5b4fc",
                background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
                padding: "6px 12px", borderRadius: 8, textDecoration: "none",
              }}>
                <LayoutDashboard style={{ width: 14, height: 14 }} />
                Admin
              </Link>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  padding: "6px 8px 6px 14px", borderRadius: 999, cursor: "pointer",
                }}>
                  <div style={{ textAlign: "right", lineHeight: 1.15 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{session.user.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Discord</div>
                  </div>
                  {session.user.image ? (
                    <img src={session.user.image} alt="" style={{
                      width: 34, height: 34, borderRadius: "50%",
                      boxShadow: "0 0 0 2px rgba(99,102,241,0.6)",
                    }} />
                  ) : (
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 14, color: "#fff",
                      boxShadow: "0 0 0 2px rgba(99,102,241,0.6)",
                    }}>{session.user.name?.[0]?.toUpperCase()}</div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" style={{
                background: "#0d0e2a", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12, minWidth: 160, padding: "4px",
              }}>
                {session.user.isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => router.push("/admin")} style={{ color: "#a5b4fc", cursor: "pointer" }}>
                      <Shield style={{ width: 14, height: 14, marginRight: 8 }} />Panel Admin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator style={{ background: "rgba(255,255,255,0.08)" }} />
                  </>
                )}
                <DropdownMenuItem onClick={() => signOut()} style={{ color: "#f87171", cursor: "pointer" }}>
                  <LogOut style={{ width: 14, height: 14, marginRight: 8 }} />Cerrar sesion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <button onClick={() => signIn("discord")} style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "linear-gradient(135deg,#6366f1,#7c3aed)",
            border: "none", color: "#fff", fontWeight: 600, fontSize: 14,
            padding: "10px 18px", borderRadius: 10, cursor: "pointer",
            boxShadow: "0 6px 18px rgba(99,102,241,0.35)", fontFamily: "inherit",
          }}>
            <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: "currentColor" }}>
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.103.129 18.117a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            Iniciar sesion con Discord
          </button>
        )}
      </div>
    </nav>
  )
}
