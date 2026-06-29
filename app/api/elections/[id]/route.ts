import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ElectionStatus } from "@prisma/client"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const election = await prisma.election.findUnique({
    where: { id },
    include: {
      candidates: true,
      _count: { select: { votes: true } },
    },
  })
  if (!election) return Response.json({ error: "Not found" }, { status: 404 })
  return Response.json(election)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { title, description, startDate, endDate, status } = body

  const start = startDate ? new Date(startDate) : undefined
  const end = endDate ? new Date(endDate) : undefined

  let computedStatus: ElectionStatus | undefined = status
  if (start && end && !status) {
    const now = new Date()
    if (now >= start && now <= end) computedStatus = "ACTIVE"
    else if (now > end) computedStatus = "CLOSED"
    else computedStatus = "DRAFT"
  }

  const election = await prisma.election.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(start && { startDate: start }),
      ...(end && { endDate: end }),
      ...(computedStatus && { status: computedStatus }),
    },
    include: { candidates: true },
  })

  return Response.json(election)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { id } = await params
  await prisma.election.delete({ where: { id } })
  return Response.json({ success: true })
}
