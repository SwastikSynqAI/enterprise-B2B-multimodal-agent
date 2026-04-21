import { PrismaClient } from '@prisma/client'
import { loadConfig } from '../../../lib/config.js'

const prisma = new PrismaClient()

async function searchContactsViaApollo(
  domain: string,
  titles: string[]
): Promise<Record<string, unknown>[]> {
  const apiKey = process.env.APOLLO_API_KEY
  if (!apiKey) return []

  const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
    body: JSON.stringify({
      organization_domains: [domain],
      person_titles: titles,
      per_page: 5,
    }),
  })

  if (!res.ok) return []
  const json = await res.json()
  return (json.people ?? []) as Record<string, unknown>[]
}

export async function enrichContacts(): Promise<void> {
  const config = loadConfig()
  const titles = config.icp.personas.map(p => p.title)

  const companies = await prisma.predictionCompany.findMany({
    where: { leads: { none: {} } },
    take: 20,
  })

  let enriched = 0
  for (const company of companies) {
    if (!company.domain) continue

    const people = await searchContactsViaApollo(company.domain, titles)
    for (const person of people) {
      await prisma.bDLead.create({
        data: {
          companyId: company.id,
          firstName: person.first_name as string | undefined,
          lastName: person.last_name as string | undefined,
          email: person.email as string | undefined,
          linkedinUrl: person.linkedin_url as string | undefined,
          title: person.title as string | undefined,
          enrichedAt: new Date(),
        },
      })
      enriched++
    }
  }

  console.log(`[BDEngine] Enriched ${enriched} contacts`)
}
