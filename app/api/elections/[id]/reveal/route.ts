import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { id: electionId } = await params

  const election = await prisma.election.update({
    where: { id: electionId },
    data: { resultsRevealed: true, status: "CLOSED" },
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

  const results = election.lists.map((list) => ({
    ...list,
    listVotes: listVotes.find((lv: LvRow) => lv.listId === list.id)?._count.listId ?? 0,
    members: list.members.map((m) => ({
      ...m,
      memberVotes: memberVotes.find((mv: MvRow) => mv.memberId === m.id)?._count.memberId ?? 0,
    })),
  }))

  return Response.json({ election, results })
}
