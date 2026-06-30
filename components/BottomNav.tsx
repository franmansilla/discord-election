"use client"

import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const VoteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/>
  </svg>
)
const RegisterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
  </svg>
)
const ResultsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)
const AdminIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
  </svg>
)

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  // Extract election ID from current path
  const electionMatch = pathname.match(/\/(vote|results|elections)\/([^/]+)/)
  const electionId = electionMatch?.[2]

  const isActive = (pattern: string) => pathname.startsWith(pattern)
  const isHome = pathname === "/"

  const items = [
    {
      label: "Inicio",
      icon: <HomeIcon />,
      active: isHome,
      href: "/",
      show: true,
    },
    {
      label: "Votar",
      icon: <VoteIcon />,
      active: pathname.startsWith("/vote"),
      href: electionId ? `/vote/${electionId}` : null,
      show: !!electionId,
    },
    {
      label: "Postularse",
      icon: <RegisterIcon />,
      active: pathname.includes("/register"),
      href: electionId ? `/elections/${electionId}/register` : null,
      show: !!electionId,
    },
    {
      label: "Resultados",
      icon: <ResultsIcon />,
      active: pathname.startsWith("/results"),
      href: electionId ? `/results/${electionId}` : null,
      show: !!electionId,
    },
    {
      label: "Admin",
      icon: <AdminIcon />,
      active: pathname.startsWith("/admin"),
      href: "/admin",
      show: !!session?.user?.isAdmin,
    },
  ].filter(i => i.show)

  if (items.length <= 1) return null

  return (
    <div style={{
      position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
      zIndex: 50, display: "flex", gap: 4,
      background: "rgba(13,14,42,0.85)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.12)",
      padding: 6, borderRadius: 14,
      boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
    }}>
      {items.map(item => (
        <button
          key={item.label}
          onClick={() => item.href && router.push(item.href)}
          disabled={!item.href}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            border: "none", cursor: item.href ? "pointer" : "default",
            fontFamily: "inherit", fontSize: 11, fontWeight: 600,
            padding: "9px 16px", borderRadius: 9, transition: "all .15s",
            background: item.active
              ? "linear-gradient(135deg,#6366f1,#7c3aed)"
              : "transparent",
            color: item.active ? "#fff" : "rgba(255,255,255,0.55)",
            boxShadow: item.active ? "0 4px 14px rgba(99,102,241,0.4)" : "none",
          }}
          onMouseEnter={e => {
            if (!item.active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"
          }}
          onMouseLeave={e => {
            if (!item.active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"
          }}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  )
}
