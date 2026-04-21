import { PrismaClient } from '@prisma/client'
import type { AgentState } from '../state.js'

const prisma = new PrismaClient()

export async function logNode(state: AgentState): Promise<Partial<AgentState>> {
  await prisma.agentRun.update({
    where: { id: state.runId },
    data: {
      completedAt: new Date(),
      decisions: {
        create: state.executed.map(action => ({
          action: action.tool,
          parameters: JSON.stringify(action.parameters),
          rationale: action.rationale,
        })),
      },
    },
  })
  console.log(`[SuperAgent] Run ${state.runId} complete — ${state.executed.length} decisions`)
  return {}
}
