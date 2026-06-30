import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
import { Navbar } from "@/components/Navbar"
import Link from "next/link"

const inter = Inter({ subsets: ["latin"], weight: ["400","500","600","700","800"] })

export const metadata: Metadata = {
  title: "DiscordVote — Elecciones para tu servidor",
  description: "Plataforma de votación para administradores de Discord",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full text-white flex flex-col">
        <SessionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/10 py-4 text-center text-xs text-white/30">
            <p>DiscordVote — Sistema de elecciones transparente</p>
            <div className="flex items-center justify-center gap-4 mt-1">
              <Link href="/terms" className="hover:text-white/60 transition-colors">Terminos de Servicio</Link>
              <span>·</span>
              <Link href="/privacy" className="hover:text-white/60 transition-colors">Politica de Privacidad</Link>
            </div>
          </footer>
        </SessionProvider>
      </body>
    </html>
  )
}
