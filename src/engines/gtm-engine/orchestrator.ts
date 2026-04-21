import { PrismaClient } from '@prisma/client'
import { loadConfig } from '../../lib/config.js'
import { buildLLMClient } from '../../lib/llm.js'

const prisma = new PrismaClient()

export function buildBlogPrompt(
  companyName: string,
  predictionType: string,
  signals: string[]
): string {
  return `You are a B2B content marketer. Write a 650-800 word SEO blog post about how companies like ${companyName} can leverage ${predictionType.replace(/_/g, ' ').toLowerCase()} trends (signals: ${signals.join(', ')}) to grow. Use a professional but accessible tone. Include an H1 title and 3 H2 subheadings. No fluff.`
}

export async function runGTMEngine(): Promise<void> {
  const config = loadConfig()
  const llm = buildLLMClient(config.model)

  const run = await prisma.gTMRun.create({ data: {} })

  const topPredictions = await prisma.companyPrediction.findMany({
    orderBy: { score: 'desc' },
    take: 5,
    distinct: ['companyId'],
    include: { company: true },
  })

  const recentArticles = await prisma.dataArticle.findMany({
    orderBy: { ingestedAt: 'desc' },
    take: 5,
  })

  const contextSummary = recentArticles.map(a => `- ${a.title}`).join('\n')

  for (const prediction of topPredictions.slice(0, 1)) {
    const signals: string[] = JSON.parse(prediction.signals)

    const blogPrompt = buildBlogPrompt(
      prediction.company.name,
      prediction.predictionType,
      signals
    )
    const blogContent = await llm.chat(
      [{ role: 'user', content: blogPrompt }],
      `Context — recent market signals:\n${contextSummary}`
    )
    const titleMatch = blogContent.match(/^#\s+(.+)/m)
    await prisma.gTMBlogDraft.create({
      data: {
        runId: run.id,
        title: titleMatch?.[1] ?? 'Market Intelligence Blog Post',
        content: blogContent,
        keyword: signals[0],
      },
    })

    const liPrompt = `Write a 180-220 word LinkedIn post for a B2B company about ${prediction.predictionType.replace(/_/g, ' ').toLowerCase()} trends in their target market. Professional tone, ends with a question to drive engagement. Max 3 hashtags.`
    const liContent = await llm.chat([{ role: 'user', content: liPrompt }])
    await prisma.gTMLinkedInDraft.create({
      data: { runId: run.id, content: liContent },
    })
  }

  console.log(`[GTMEngine] Generated blog + LinkedIn drafts (pending approval)`)
}
