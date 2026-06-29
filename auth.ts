import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

const adminIds = (process.env.ADMIN_DISCORD_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean)

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID!,
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { isAdmin: true, discordId: true },
      })
      session.user.isAdmin = dbUser?.isAdmin ?? false
      session.user.discordId = dbUser?.discordId ?? ""
      return session
    },
  },
  events: {
    async createUser({ user }) {
      const account = await prisma.account.findFirst({
        where: { userId: user.id, provider: "discord" },
      })
      if (account && adminIds.includes(account.providerAccountId)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isAdmin: true },
        })
      }
    },
  },
})
