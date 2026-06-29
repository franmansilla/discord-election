import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: electionId } = await params

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    include: { candidates: true },
  })

  if (!election) return Response.json({ error: "Not found" }, { status: 404 })
  if (!election.resultsRevealed) {
    return Response.json({ error: "Results not yet revealed" }, { status: 403 })
  }

  const candidateVotes = await prisma.vote.groupBy({
    by: ["candidateId"],
    where: { electionId },
    _count: { candidateId: true },
  })

  const totalVotes = await prisma.vote.count({ where: { electionId } })

  const results = election.candidates
    .map((c) => ({
      ...c,
      voteCount: candidateVotes.find((cv) => cv.candidateId === c.id)?._count.candidateId ?? 0,
      percentage: totalVotes > 0
        ? Math.round(((candidateVotes.find((cv) => cv.candidateId === c.id)?._count.candidateId ?? 0) / totalVotes) * 100)
        : 0,
    }))
    .sort((a, b) => b.voteCount - a.voteCount)

  return Response.json({ election, results, totalVotes })
}
