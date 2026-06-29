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
  })

  const candidateVotes = await prisma.vote.groupBy({
    by: ["candidateId"],
    where: { electionId },
    _count: { candidateId: true },
  })

  const candidates = await prisma.candidate.findMany({ where: { electionId } })

  type CvRow = (typeof candidateVotes)[number]
  type CandidateRow = (typeof candidates)[number]

  const results = candidates
    .map((c: CandidateRow) => ({
      ...c,
      voteCount: candidateVotes.find((cv: CvRow) => cv.candidateId === c.id)?._count.candidateId ?? 0,
    }))
    .sort((a: { voteCount: number }, b: { voteCount: number }) => b.voteCount - a.voteCount)

  return Response.json({ election, results })
}
