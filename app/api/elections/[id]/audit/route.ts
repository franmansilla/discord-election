import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { id: electionId } = await params

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    include: {
      lists: {
        include: {
          members: {
            include: { user: { select: { name: true, image: true } } },
            orderBy: { position: "asc" },
          },
        },
      },
    },
  })
  if (!election) return Response.json({ error: "Not found" }, { status: 404 })

  const voters = await prisma.vote.findMany({
    where: { electionId, position: { in: [0, 1] } },
    distinct: ["voterId"],
    include: {
      voter: {
        select: {
          id: true,
          name: true,
          image: true,
          accounts: {
            where: { provider: "discord" },
            select: { providerAccountId: true },
          },
        },
      },
    },
    orderBy: { votedAt: "asc" },
  })

  type VoterRow = (typeof voters)[number]
  const auditData = voters.map((v: VoterRow) => ({
    voterId: v.voter.id,
    username: v.voter.name ?? "Usuario",
    image: v.voter.image,
    discordId: v.voter.accounts[0]?.providerAccountId ?? "",
    votedAt: v.votedAt,
  }))

  let results = null
  if (election.resultsRevealed) {
    const listVotes = await prisma.vote.groupBy({
      by: ["listId"],
      where: { electionId, listId: { not: null } },
      _count: { listId: true },
    })
    const memberVotes = await prisma.vote.groupBy({
      by: ["memberId"],
      where: { electionId, memberId: { not: null } },
      _count: { memberId: true },
    })

    type LvRow = (typeof listVotes)[number]
    type MvRow = (typeof memberVotes)[number]

    results = election.lists.map((list) => ({
      ...list,
      listVoteCount: listVotes.find((lv: LvRow) => lv.listId === list.id)?._count.listId ?? 0,
      members: list.members.map((m) => ({
        ...m,
        memberVoteCount: memberVotes.find((mv: MvRow) => mv.memberId === m.id)?._count.memberId ?? 0,
      })),
    }))
  }

  return Response.json({
    election,
    voters: auditData,
    totalVotes: auditData.length,
    results,
  })
}
