import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
import { Navbar } from "@/components/Navbar"

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DiscordVote — Elecciones para tu servidor",
  description: "Plataforma de votación para administradores de Discord",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#0d0e1a] text-white flex flex-col">
        <SessionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/10 py-4 text-center text-xs text-white/30">
            DiscordVote — Sistema de elecciones transparente
          </footer>
        </SessionProvider>
      </body>
    </html>
  )
}
