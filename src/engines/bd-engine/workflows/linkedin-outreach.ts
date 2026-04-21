import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
import { loadConfig } from '../../../lib/config.js'

const prisma = new PrismaClient()

function renderTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (t, [k, v]) => t.replace(new RegExp(`{{${k}}}`, 'g'), v),
    template
  )
}

export async function runLinkedInOutreach(): Promise<void> {
  const config = loadConfig()

  if (!config.outreach.linkedin.enabled) {
    console.log('[BDEngine] LinkedIn outreach disabled in config')
    return
  }

  const dailyLimit = config.outreach.linkedin.daily_connection_limit
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sentToday = await prisma.outreachEvent.count({
    where: { channel: 'linkedin', type: 'connection_request', sentAt: { gte: today } },
  })

  if (sentToday >= dailyLimit) {
    console.log(`[BDEngine] Daily LinkedIn limit reached (${sentToday}/${dailyLimit})`)
    return
  }

  const remaining = dailyLimit - sentToday
  const leads = await prisma.bDLead.findMany({
    where: {
      linkedinUrl: { not: null },
      outreachEvents: { none: { channel: 'linkedin' } },
    },
    include: { company: true },
    take: remaining,
  })

  if (leads.length === 0) {
    console.log('[BDEngine] No leads available for LinkedIn outreach')
    return
  }

  const browser = await chromium.launchPersistentContext('.linkedin-session', {
    headless: false,
  })
  const page = await browser.newPage()

  for (const lead of leads) {
    try {
      await page.goto(lead.linkedinUrl!, { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForTimeout(2000)

      const connectBtn = page.locator('button:has-text("Connect")').first()
      if (!(await connectBtn.isVisible({ timeout: 3000 }))) continue

      await connectBtn.click()
      await page.waitForTimeout(1000)

      const addNoteBtn = page.locator('button:has-text("Add a note")')
      if (await addNoteBtn.isVisible({ timeout: 2000 })) {
        await addNoteBtn.click()
        const message = renderTemplate(config.outreach.linkedin.connection_request, {
          first_name: lead.firstName ?? 'there',
          company: lead.company.name,
          signal_context: 'growing rapidly',
        })
        await page.locator('textarea[name="message"]').fill(message.slice(0, 300))
      }

      const sendBtn = page.locator('button:has-text("Send")').last()
      await sendBtn.click()
      await page.waitForTimeout(2000)

      await prisma.outreachEvent.create({
        data: {
          leadId: lead.id,
          channel: 'linkedin',
          type: 'connection_request',
          status: 'sent',
          template: config.outreach.linkedin.connection_request,
        },
      })

      console.log(`[BDEngine] LinkedIn connection sent to ${lead.firstName} at ${lead.company.name}`)
    } catch (err) {
      console.error(`[BDEngine] LinkedIn error for lead ${lead.id}:`, err)
    }
  }

  await browser.close()
}
