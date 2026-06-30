import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string; listId: string }> }

// JOIN list as position 2
export async function POST(request: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Debes iniciar sesion" }, { status: 401 })
  }

  const { id: electionId, listId } = await params
  const { role, proposal, campaignImage } = await request.json()

  const list = await prisma.candidateList.findUnique({
    where: { id: listId, electionId },
    include: { members: true },
  })
  if (!list) return Response.json({ error: "Lista no encontrada" }, { status: 404 })
  if (list.status === "COMPLETE") {
    return Response.json({ error: "Esta lista ya esta completa" }, { status: 400 })
  }

  const existing = await prisma.listMember.findFirst({
    where: { userId: session.user.id, list: { electionId } },
  })
  if (existing) {
    return Response.json({ error: "Ya sos candidato en esta eleccion" }, { status: 400 })
  }

  if (list.members.some((m) => m.userId === session.user.id)) {
    return Response.json({ error: "Ya sos miembro de esta lista" }, { status: 400 })
  }

  const [, updatedList] = await prisma.$transaction([
    prisma.listMember.create({
      data: {
        listId,
        userId: session.user.id,
        position: 2,
        role: role?.trim() || null,
        proposal: proposal?.trim() || null,
        campaignImage: campaignImage || null,
      },
    }),
    prisma.candidateList.update({
      where: { id: listId },
      data: { status: "COMPLETE" },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { position: "asc" },
        },
      },
    }),
  ])

  return Response.json(updatedList)
}

// LEAVE list
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Debes iniciar sesion" }, { status: 401 })
  }

  const { electionId, listId } = { electionId: (await params).id, listId: (await params).listId }

  const election = await prisma.election.findUnique({ where: { id: electionId } })
  if (election?.status === "ACTIVE" || election?.status === "CLOSED") {
    return Response.json({ error: "No podes retirarte de una eleccion activa o cerrada" }, { status: 400 })
  }

  const member = await prisma.listMember.findFirst({
    where: { listId, userId: session.user.id },
  })
  if (!member) return Response.json({ error: "No sos miembro de esta lista" }, { status: 404 })

  const list = await prisma.candidateList.findUnique({
    where: { id: listId },
    include: { members: true },
  })

  if (list && list.members.length === 1 && member.position === 1) {
    await prisma.candidateList.delete({ where: { id: listId } })
  } else {
    await prisma.$transaction([
      prisma.listMember.delete({ where: { id: member.id } }),
      prisma.candidateList.update({ where: { id: listId }, data: { status: "OPEN" } }),
    ])
  }

  return Response.json({ success: true })
}

// Admin delete list
export async function PUT(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 403 })
  }
  const { listId } = await params
  await prisma.candidateList.delete({ where: { id: listId } })
  return Response.json({ success: true })
}
