import { PrismaClient } from '@prisma/client'
import type { AgentState } from '../state.js'

const prisma = new PrismaClient()

export async function readNode(state: AgentState): Promise<Partial<AgentState>> {
  const [lastMonitoring, recentOutreach, pendingDrafts, topPredictions] =
    await Promise.all([
      prisma.monitoringReport.findFirst({ orderBy: { runAt: 'desc' } }),
      prisma.outreachEvent.count({
        where: { sentAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      prisma.gTMBlogDraft.count({ where: { status: 'pending_approval' } }),
      prisma.companyPrediction.findMany({
        orderBy: { score: 'desc' },
        take: 3,
        include: { company: true },
      }),
    ])

  const context = [
    `Trigger: ${state.trigger}`,
    `System health: ${lastMonitoring?.overallStatus ?? 'UNKNOWN'}`,
    `Outreach sent (24h): ${recentOutreach}`,
    `GTM drafts pending approval: ${pendingDrafts}`,
    `Top predictions: ${topPredictions
      .map(p => `${p.company.name} (${p.score.toFixed(2)})`)
      .join(', ')}`,
    lastMonitoring ? `Health checks: ${lastMonitoring.checks}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  return { context }
}
