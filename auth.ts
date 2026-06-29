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
        select: {
          isAdmin: true,
          accounts: {
            where: { provider: "discord" },
            select: { providerAccountId: true },
          },
        },
      })
      session.user.isAdmin = dbUser?.isAdmin ?? false
      session.user.discordId = dbUser?.accounts[0]?.providerAccountId ?? ""
      return session
    },
  },
  events: {
    async linkAccount({ user, account }) {
      if (account.provider === "discord" && adminIds.includes(account.providerAccountId)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isAdmin: true },
        })
      }
    },
  },
})
