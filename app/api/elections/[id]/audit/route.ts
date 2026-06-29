import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { id: electionId } = await params

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    include: {
      candidates: true,
      _count: { select: { votes: true } },
    },
  })
  if (!election) return Response.json({ error: "Not found" }, { status: 404 })

  const votes = await prisma.vote.findMany({
    where: { electionId },
    include: {
      voter: {
        select: {
          id: true,
          username: true,
          avatar: true,
          discordId: true,
        },
      },
    },
    orderBy: { votedAt: "asc" },
  })

  type VoteRow = (typeof votes)[number]
  const auditData = votes.map((v: VoteRow) => ({
    voterId: v.voter.id,
    username: v.voter.username,
    avatar: v.voter.avatar,
    discordId: v.voter.discordId,
    votedAt: v.votedAt,
  }))

  let results = null
  if (election.resultsRevealed) {
    const candidateVotes = await prisma.vote.groupBy({
      by: ["candidateId"],
      where: { electionId },
      _count: { candidateId: true },
    })

    type CvRow = (typeof candidateVotes)[number]
    type CandidateRow = (typeof election.candidates)[number]

    results = election.candidates
      .map((c: CandidateRow) => ({
        ...c,
        voteCount: candidateVotes.find((cv: CvRow) => cv.candidateId === c.id)?._count.candidateId ?? 0,
      }))
      .sort((a: { voteCount: number }, b: { voteCount: number }) => b.voteCount - a.voteCount)
  }

  return Response.json({
    election,
    voters: auditData,
    totalVotes: votes.length,
    results,
  })
}
