import { PrismaClient } from '@prisma/client'
import { loadConfig } from '../../lib/config.js'
import type { PredictionType } from '../../lib/config.js'

const prisma = new PrismaClient()

export function scoreCompany(
  signals: string[],
  predictionTypes: PredictionType[],
  horizon: number
): number {
  if (signals.length === 0) return 0

  let total = 0
  const horizonDecay = horizon === 30 ? 1.0 : horizon === 60 ? 0.8 : 0.6
  const momentum = Math.min(signals.length / 10, 1.0)

  for (const pt of predictionTypes) {
    const matches = pt.signals.filter(s => signals.includes(s)).length
    const matchRate = pt.signals.length > 0 ? matches / pt.signals.length : 0
    total += matchRate * momentum * horizonDecay * pt.weight
  }

  return Math.min(total, 1.0)
}

export async function runPredictionEngine(): Promise<void> {
  const config = loadConfig()
  const { prediction_types, scoring } = config.predictions

  const run = await prisma.predictionRun.create({ data: {} })

  const companies = await prisma.predictionCompany.findMany({
    include: { signals: true },
  })

  let scoredCount = 0

  for (const company of companies) {
    for (const horizon of scoring.horizons) {
      const cutoff = new Date(Date.now() - horizon * 24 * 60 * 60 * 1000)
      const recentSignals = company.signals
        .filter(s => s.detectedAt >= cutoff)
        .map(s => s.type)

      for (const pt of prediction_types) {
        const score = scoreCompany(recentSignals, [pt], horizon)
        if (score < scoring.min_score_threshold) continue

        await prisma.companyPrediction.create({
          data: {
            runId: run.id,
            companyId: company.id,
            predictionType: pt.name,
            score,
            horizon,
            signals: JSON.stringify(recentSignals),
          },
        })
        scoredCount++
      }
    }
  }

  const topPredictions = await prisma.companyPrediction.findMany({
    where: { runId: run.id },
    orderBy: { score: 'desc' },
    take: scoring.top_n,
    include: { company: true },
  })

  console.log(
    `[PredictionEngine] Scored ${companies.length} companies, ${scoredCount} predictions above threshold. Top: ${
      topPredictions[0]?.company.name ?? 'none'
    } (${topPredictions[0]?.score.toFixed(2) ?? 0})`
  )
}
