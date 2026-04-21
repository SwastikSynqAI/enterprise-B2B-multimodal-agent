import { PrismaClient } from '@prisma/client'
import { buildSuperAgentGraph } from './graph.js'

const prisma = new PrismaClient()

export async function runSuperAgent(trigger: string): Promise<void> {
  console.log(`[SuperAgent] Starting run — trigger: ${trigger}`)
  const run = await prisma.agentRun.create({ data: { trigger } })
  const graph = buildSuperAgentGraph()
  await graph.invoke({ trigger, runId: run.id })
  console.log(`[SuperAgent] Run complete`)
}
