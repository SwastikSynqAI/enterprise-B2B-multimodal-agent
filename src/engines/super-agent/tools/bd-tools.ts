import { PrismaClient } from '@prisma/client'
import { clampConnectionLimit } from './guardrails.js'

const prisma = new PrismaClient()

export async function adjustConnectionLimit(params: { limit: number }): Promise<void> {
  const safe = clampConnectionLimit(params.limit)
  console.log(`[SuperAgent:BDTools] Connection limit set to ${safe}`)
}

export async function upsertMessageTemplate(params: {
  channel: string
  content: string
}): Promise<void> {
  await prisma.messageTemplate.upsert({
    where: { channel: params.channel },
    update: { content: params.content },
    create: { channel: params.channel, content: params.content },
  })
  console.log(`[SuperAgent:BDTools] Updated template for ${params.channel}`)
}
