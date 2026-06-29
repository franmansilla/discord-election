import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  if (!election.resultsRevealed) {
    return Response.json({ error: "Resultados no revelados aun" }, { status: 403 })
  }

  const totalVoters = await prisma.vote.groupBy({
    by: ["voterId"],
    where: { electionId },
  })
  const totalVotes = totalVoters.length

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

  const results = election.lists
    .map((list) => {
      const lv = listVotes.find((v: LvRow) => v.listId === list.id)?._count.listId ?? 0
      return {
        ...list,
        listVoteCount: lv,
        percentage: totalVotes > 0 ? Math.round((lv / totalVotes) * 100) : 0,
        members: list.members.map((m) => ({
          ...m,
          memberVoteCount: memberVotes.find((v: MvRow) => v.memberId === m.id)?._count.memberId ?? 0,
        })),
      }
    })
    .sort((a, b) => b.listVoteCount - a.listVoteCount)

  return Response.json({ election, results, totalVotes })
}
