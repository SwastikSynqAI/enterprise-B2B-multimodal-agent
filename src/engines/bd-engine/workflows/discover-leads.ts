import { PrismaClient } from '@prisma/client'
import { loadConfig } from '../../../lib/config.js'
import type { ICPConfig } from '../../../lib/config.js'

const prisma = new PrismaClient()

export interface ApolloSearchParams {
  organization_industries: string[]
  organization_num_employees_ranges: string[]
  organization_locations: string[]
  page: number
  per_page: number
}

export function buildApolloSearchParams(icp: ICPConfig): ApolloSearchParams {
  return {
    organization_industries: icp.company.industries,
    organization_num_employees_ranges: [
      `${icp.company.employee_range[0]},${icp.company.employee_range[1]}`,
    ],
    organization_locations: icp.company.geographies,
    page: 1,
    per_page: 25,
  }
}

export async function discoverLeads(): Promise<void> {
  const config = loadConfig()
  const apiKey = process.env.APOLLO_API_KEY
  if (!apiKey) {
    console.warn('[BDEngine] APOLLO_API_KEY not set, skipping discovery')
    return
  }

  const params = buildApolloSearchParams(config.icp)

  const res = await fetch('https://api.apollo.io/v1/mixed_companies/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    console.error('[BDEngine] Apollo API error:', res.status, res.statusText)
    return
  }

  const json = await res.json()
  const companies: Record<string, unknown>[] = (json.organizations ?? []) as Record<string, unknown>[]

  let created = 0
  for (const org of companies) {
    const domain = org.primary_domain as string | undefined
    if (!domain) continue

    const existing = await prisma.predictionCompany.findFirst({ where: { domain } })
    if (existing) continue

    await prisma.predictionCompany.create({
      data: {
        name: (org.name as string) ?? 'Unknown',
        domain,
        industry: org.industry as string | undefined,
        geography: (org.hq_location ?? org.country) as string | undefined,
        employeeCount: org.estimated_num_employees as number | undefined,
      },
    })
    created++
  }

  console.log(`[BDEngine] Discovered ${created} new companies via Apollo`)
}
