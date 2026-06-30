import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
import { Navbar } from "@/components/Navbar"
import { BottomNav } from "@/components/BottomNav"
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
          <main className="flex-1" style={{ paddingBottom: 100 }}>{children}</main>
          <BottomNav />
        </SessionProvider>
      </body>
    </html>
  )
}
