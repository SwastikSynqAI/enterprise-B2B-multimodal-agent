import { createTransport } from 'nodemailer'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'
import { loadConfig } from '../../../lib/config.js'

const prisma = new PrismaClient()

function renderTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (t, [k, v]) => t.replace(new RegExp(`{{${k}}}`, 'g'), v),
    template
  )
}

export async function runEmailOutreach(): Promise<void> {
  const config = loadConfig()

  if (!config.outreach.email.enabled) {
    console.log('[BDEngine] Email outreach disabled — SMTP not configured')
    return
  }

  const transport = createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const bodyTemplatePath = resolve(config.outreach.email.body_template)
  let bodyTemplate: string
  try {
    bodyTemplate = readFileSync(bodyTemplatePath, 'utf-8')
  } catch {
    console.error('[BDEngine] Email template not found:', bodyTemplatePath)
    return
  }

  const leads = await prisma.bDLead.findMany({
    where: {
      email: { not: null },
      outreachEvents: { none: { channel: 'email', type: 'email_intro' } },
    },
    include: { company: true },
    take: 30,
  })

  let sent = 0
  for (const lead of leads) {
    try {
      const vars: Record<string, string> = {
        first_name: lead.firstName ?? 'there',
        company: lead.company.name,
        signal_context: 'expanding operations',
        your_name: process.env.EMAIL_FROM_NAME ?? '',
        your_company: '',
      }

      await transport.sendMail({
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
        to: lead.email!,
        subject: renderTemplate(config.outreach.email.subject, vars),
        html: renderTemplate(bodyTemplate, vars),
      })

      await prisma.outreachEvent.create({
        data: {
          leadId: lead.id,
          channel: 'email',
          type: 'email_intro',
          status: 'sent',
        },
      })
      sent++
    } catch (err) {
      console.error(`[BDEngine] Email error for ${lead.email}:`, err)
    }
  }

  console.log(`[BDEngine] Sent ${sent} intro emails`)
}
