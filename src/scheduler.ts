import 'dotenv/config'
import { CronJob } from 'cron'
import { runDataIngestion } from './engines/data-engine/ingest.js'
import { runPredictionEngine } from './engines/prediction-engine/orchestrator.js'
import { discoverLeads } from './engines/bd-engine/workflows/discover-leads.js'
import { enrichContacts } from './engines/bd-engine/workflows/enrich-contacts.js'
import { runLinkedInOutreach } from './engines/bd-engine/workflows/linkedin-outreach.js'
import { runEmailOutreach } from './engines/bd-engine/workflows/email-outreach.js'
import { runGTMEngine } from './engines/gtm-engine/orchestrator.js'
import { runMonitoring } from './engines/monitoring/health-check.js'
import { runSuperAgent } from './engines/super-agent/index.js'

function schedule(cronExpr: string, name: string, fn: () => Promise<void>) {
  new CronJob(
    cronExpr,
    async () => {
      console.log(`\n[Scheduler] Starting: ${name} at ${new Date().toISOString()}`)
      try {
        await fn()
      } catch (err) {
        console.error(`[Scheduler] ${name} failed:`, err)
      }
    },
    null,
    true,
    'Asia/Kolkata'
  )
}

// Data ingestion — every 4 hours
schedule('0 1,5,9,13,17,21 * * *', 'Data Engine', runDataIngestion)

// Prediction scoring — daily 5 AM
schedule('0 5 * * *', 'Prediction Engine', runPredictionEngine)

// Super-agent after data — 6 AM
schedule('0 6 * * *', 'Super-Agent (post-data)', () => runSuperAgent('post_data'))

// BD lead discovery — daily 9 AM
schedule('0 9 * * *', 'BD Lead Discovery', discoverLeads)

// BD contact enrichment — daily 9:30 AM
schedule('30 9 * * *', 'BD Contact Enrichment', enrichContacts)

// LinkedIn outreach — weekdays 10 AM
schedule('0 10 * * 1-5', 'LinkedIn Outreach', runLinkedInOutreach)

// Email outreach — weekdays 10:30 AM
schedule('30 10 * * 1-5', 'Email Outreach', runEmailOutreach)

// Super-agent after BD — 11 AM
schedule('0 11 * * *', 'Super-Agent (post-bd)', () => runSuperAgent('post_bd'))

// GTM content generation — daily 2 PM
schedule('0 14 * * *', 'GTM Engine', runGTMEngine)

// Super-agent after GTM — 2:30 PM
schedule('30 14 * * *', 'Super-Agent (post-gtm)', () => runSuperAgent('post_gtm'))

// Monitoring health check — daily 6 PM
schedule('0 18 * * *', 'Monitoring Engine', runMonitoring)

// Super-agent after monitoring — 6:30 PM
schedule('30 18 * * *', 'Super-Agent (post-monitoring)', () => runSuperAgent('post_monitoring'))

console.log('[enterprise-bd-os] All engines scheduled. Running...')
console.log('[enterprise-bd-os] Run `pnpm setup` if you haven\'t configured your environment yet.')
