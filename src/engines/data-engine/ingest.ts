import { PrismaClient } from '@prisma/client'
import { loadConfig } from '../../lib/config.js'
import { getEnabledSources } from './sources/source-registry.js'

const prisma = new PrismaClient()

const SIGNAL_KEYWORDS: Record<string, string[]> = {
  hiring_surge: ['hiring', 'new hires', 'headcount', 'recruiting', 'talent acquisition', 'job openings', 'expanding team'],
  funding_round: ['series a', 'series b', 'series c', 'raised', 'funding', 'investment', 'venture', 'seed round'],
  market_expansion: ['expansion', 'new market', 'entering', 'launch in', 'scale into', 'new region'],
  new_office: ['new office', 'new headquarters', 'opens office', 'new location', 'new hq'],
  job_posting_vendor: ['looking for vendor', 'rfp', 'request for proposal', 'evaluating solutions', 'vendor evaluation'],
  budget_cycle: ['q4 budget', 'annual budget', 'budget planning', 'fiscal year', 'budget cycle'],
}

export function tagArticle(text: string, signals: string[]): string[] {
  const lower = text.toLowerCase()
  const matched: string[] = []
  for (const signal of signals) {
    const keywords = SIGNAL_KEYWORDS[signal] ?? [signal.replace(/_/g, ' ')]
    if (keywords.some(kw => lower.includes(kw))) {
      matched.push(signal)
    }
  }
  return matched
}

export async function runDataIngestion(): Promise<void> {
  const config = loadConfig()
  const sources = getEnabledSources(config.sources)
  const icpSignals = config.icp.company.signals
  let articlesNew = 0
  let articlesDupe = 0
  const errors: string[] = []

  const run = await prisma.dataIngestionRun.create({ data: {} })

  for (const source of sources) {
    try {
      const articles = await source.fetch()
      for (const article of articles) {
        if (!article.url || !article.title) continue
        const tags = tagArticle(article.title + ' ' + (article.content ?? ''), icpSignals)
        if (tags.length === 0) continue

        const existing = await prisma.dataArticle.findUnique({ where: { url: article.url } })
        if (existing) { articlesDupe++; continue }

        await prisma.dataArticle.create({
          data: {
            url: article.url,
            title: article.title,
            content: article.content,
            source: article.source,
            tags: JSON.stringify(tags),
            publishedAt: article.publishedAt,
          },
        })
        articlesNew++
      }
    } catch (err) {
      errors.push(`${source.name}: ${String(err)}`)
    }
  }

  await prisma.dataIngestionRun.update({
    where: { id: run.id },
    data: {
      completedAt: new Date(),
      articlesNew,
      articlesDupe,
      errors: errors.length > 0 ? JSON.stringify(errors) : null,
    },
  })

  console.log(`[DataEngine] Ingested ${articlesNew} new, ${articlesDupe} dupes, ${errors.length} errors`)
}
