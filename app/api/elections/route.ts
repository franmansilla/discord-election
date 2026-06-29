import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ElectionStatus, VoteMode } from "@prisma/client"

export async function GET() {
  const elections = await prisma.election.findMany({
    include: {
      lists: {
        include: { members: true },
      },
      _count: { select: { votes: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return Response.json(elections)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 403 })
  }

  const body = await request.json()
  const { title, description, startDate, endDate, voteMode } = body

  if (!title || !startDate || !endDate) {
    return Response.json({ error: "Faltan campos obligatorios" }, { status: 400 })
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  const now = new Date()

  let status: ElectionStatus = "DRAFT"
  if (now >= start && now <= end) status = "ACTIVE"
  if (now > end) status = "CLOSED"

  const election = await prisma.election.create({
    data: {
      title,
      description,
      startDate: start,
      endDate: end,
      status,
      voteMode: (voteMode as VoteMode) ?? "FULL_LIST",
    },
    include: { lists: true },
  })

  return Response.json(election, { status: 201 })
}
