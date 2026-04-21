import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface CheckResult {
  name: string
  status: 'ok' | 'warn' | 'fail'
  message?: string
}

export function computeOverallStatus(
  checks: CheckResult[]
): 'HEALTHY' | 'DEGRADED' | 'DOWN' {
  if (checks.some(c => c.status === 'fail')) return 'DOWN'
  if (checks.some(c => c.status === 'warn')) return 'DEGRADED'
  return 'HEALTHY'
}

async function checkDataEngine(): Promise<CheckResult> {
  const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000)
  const lastRun = await prisma.dataIngestionRun.findFirst({
    orderBy: { startedAt: 'desc' },
  })
  if (!lastRun) return { name: 'data_engine', status: 'warn', message: 'No ingestion runs found' }
  if (lastRun.startedAt < cutoff) return { name: 'data_engine', status: 'warn', message: 'No ingestion in 12h' }
  return { name: 'data_engine', status: 'ok' }
}

async function checkBDEngine(): Promise<CheckResult> {
  const total = await prisma.bDLead.count()
  if (total === 0) return { name: 'bd_engine', status: 'warn', message: 'No leads discovered yet' }

  const bounced = await prisma.outreachEvent.count({ where: { status: 'bounced' } })
  const sent = await prisma.outreachEvent.count({ where: { channel: 'email' } })
  if (sent > 0 && bounced / sent > 0.15) {
    return {
      name: 'bd_engine',
      status: 'warn',
      message: `High email bounce rate: ${((bounced / sent) * 100).toFixed(1)}%`,
    }
  }
  return { name: 'bd_engine', status: 'ok' }
}

async function checkPredictionEngine(): Promise<CheckResult> {
  const lastRun = await prisma.predictionRun.findFirst({ orderBy: { runAt: 'desc' } })
  if (!lastRun) return { name: 'prediction_engine', status: 'warn', message: 'No prediction runs found' }
  return { name: 'prediction_engine', status: 'ok' }
}

async function checkGTMEngine(): Promise<CheckResult> {
  const pending = await prisma.gTMBlogDraft.count({ where: { status: 'pending_approval' } })
  if (pending > 10) {
    return { name: 'gtm_engine', status: 'warn', message: `${pending} drafts awaiting approval` }
  }
  return { name: 'gtm_engine', status: 'ok' }
}

async function checkSuperAgent(): Promise<CheckResult> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const lastRun = await prisma.agentRun.findFirst({ orderBy: { startedAt: 'desc' } })
  if (!lastRun) return { name: 'super_agent', status: 'warn', message: 'Super-agent has never run' }
  if (lastRun.startedAt < cutoff) {
    return { name: 'super_agent', status: 'warn', message: 'Super-agent inactive >24h' }
  }
  return { name: 'super_agent', status: 'ok' }
}

export async function runMonitoring(): Promise<void> {
  const checks = await Promise.all([
    checkDataEngine(),
    checkBDEngine(),
    checkPredictionEngine(),
    checkGTMEngine(),
    checkSuperAgent(),
  ])

  const overallStatus = computeOverallStatus(checks)

  await prisma.monitoringReport.create({
    data: { overallStatus, checks: JSON.stringify(checks) },
  })

  const warnings = checks.filter(c => c.status !== 'ok')
  console.log(
    `[Monitoring] Status: ${overallStatus}${
      warnings.length ? ' — ' + warnings.map(w => w.message).join(', ') : ''
    }`
  )
}
