import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Must be logged in to vote" }, { status: 401 })
  }

  const { id: electionId } = await params
  const { candidateId } = await request.json()

  const election = await prisma.election.findUnique({ where: { id: electionId } })
  if (!election) return Response.json({ error: "Election not found" }, { status: 404 })

  const now = new Date()
  if (election.status !== "ACTIVE" || now < election.startDate || now > election.endDate) {
    return Response.json({ error: "Election is not currently open for voting" }, { status: 400 })
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId, electionId },
  })
  if (!candidate) return Response.json({ error: "Candidate not found" }, { status: 404 })

  const existingVote = await prisma.vote.findUnique({
    where: { electionId_voterId: { electionId, voterId: session.user.id } },
  })
  if (existingVote) {
    return Response.json({ error: "You have already voted in this election" }, { status: 400 })
  }

  const vote = await prisma.vote.create({
    data: { electionId, voterId: session.user.id, candidateId },
  })

  return Response.json({ success: true, voteId: vote.id }, { status: 201 })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ hasVoted: false })
  }

  const { id: electionId } = await params
  const vote = await prisma.vote.findUnique({
    where: { electionId_voterId: { electionId, voterId: session.user.id } },
  })

  return Response.json({ hasVoted: !!vote })
}
