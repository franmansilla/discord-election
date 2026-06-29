import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: electionId } = await params
  const lists = await prisma.candidateList.findMany({
    where: { electionId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  })
  return Response.json(lists)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Debes iniciar sesion" }, { status: 401 })
  }

  const { id: electionId } = await params
  const { listName, role, proposal } = await request.json()

  if (!listName?.trim()) {
    return Response.json({ error: "El nombre de la lista es obligatorio" }, { status: 400 })
  }

  const election = await prisma.election.findUnique({ where: { id: electionId } })
  if (!election) return Response.json({ error: "Eleccion no encontrada" }, { status: 404 })
  if (election.status === "CLOSED") {
    return Response.json({ error: "La eleccion ya esta cerrada" }, { status: 400 })
  }

  const existing = await prisma.listMember.findFirst({
    where: { userId: session.user.id, list: { electionId } },
  })
  if (existing) {
    return Response.json({ error: "Ya sos candidato en esta eleccion" }, { status: 400 })
  }

  const list = await prisma.candidateList.create({
    data: {
      electionId,
      name: listName.trim(),
      status: "OPEN",
      members: {
        create: {
          userId: session.user.id,
          position: 1,
          role: role?.trim() || null,
          proposal: proposal?.trim() || null,
        },
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { position: "asc" },
      },
    },
  })

  return Response.json(list, { status: 201 })
}
