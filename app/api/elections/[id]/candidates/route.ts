import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { name, discordTag, description, avatar } = body

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 })
  }

  const election = await prisma.election.findUnique({ where: { id } })
  if (!election) return Response.json({ error: "Election not found" }, { status: 404 })

  const candidate = await prisma.candidate.create({
    data: { electionId: id, name, discordTag, description, avatar },
  })

  return Response.json(candidate, { status: 201 })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { id: electionId } = await params
  const { candidateId } = await request.json()

  await prisma.candidate.delete({
    where: { id: candidateId, electionId },
  })

  return Response.json({ success: true })
}
