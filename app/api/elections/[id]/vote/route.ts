import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ hasVoted: false })

  const { id: electionId } = await params
  const vote = await prisma.vote.findFirst({
    where: { electionId, voterId: session.user.id },
  })
  return Response.json({ hasVoted: !!vote })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Debes iniciar sesion para votar" }, { status: 401 })
  }

  const { id: electionId } = await params
  const body = await request.json()

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    include: { lists: { include: { members: true } } },
  })
  if (!election) return Response.json({ error: "Eleccion no encontrada" }, { status: 404 })

  const now = new Date()
  if (election.status !== "ACTIVE" || now < election.startDate || now > election.endDate) {
    return Response.json({ error: "La eleccion no esta abierta para votar" }, { status: 400 })
  }

  const existingVote = await prisma.vote.findFirst({
    where: { electionId, voterId: session.user.id },
  })
  if (existingVote) {
    return Response.json({ error: "Ya votaste en esta eleccion" }, { status: 400 })
  }

  if (election.voteMode === "FULL_LIST") {
    const { listId } = body
    const list = election.lists.find((l) => l.id === listId)
    if (!list || list.status !== "COMPLETE") {
      return Response.json({ error: "Lista invalida" }, { status: 400 })
    }
    await prisma.vote.create({
      data: { electionId, voterId: session.user.id, position: 0, listId },
    })
  } else {
    // SPLIT mode: body = { pos1: memberId, pos2: memberId }
    const { pos1, pos2 } = body
    const allMembers = election.lists.flatMap((l) => l.members)
    const m1 = allMembers.find((m) => m.id === pos1 && m.position === 1)
    const m2 = allMembers.find((m) => m.id === pos2 && m.position === 2)
    if (!m1 || !m2) {
      return Response.json({ error: "Seleccion de candidatos invalida" }, { status: 400 })
    }
    await prisma.$transaction([
      prisma.vote.create({
        data: { electionId, voterId: session.user.id, position: 1, memberId: pos1 },
      }),
      prisma.vote.create({
        data: { electionId, voterId: session.user.id, position: 2, memberId: pos2 },
      }),
    ])
  }

  return Response.json({ success: true }, { status: 201 })
}
