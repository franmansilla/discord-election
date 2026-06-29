import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ElectionStatus } from "@prisma/client"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { id: electionId } = await params
  const { status } = await request.json() as { status: ElectionStatus }

  const election = await prisma.election.update({
    where: { id: electionId },
    data: { status },
  })

  return Response.json(election)
}
