import { describe, it, expect } from 'vitest'
import { buildApolloSearchParams } from '../../src/engines/bd-engine/workflows/discover-leads.js'
import type { ICPConfig } from '../../src/lib/config.js'

describe('buildApolloSearchParams', () => {
  const icp: ICPConfig = {
    company: {
      industries: ['SaaS', 'Fintech'],
      employee_range: [50, 500],
      geographies: ['India', 'Southeast Asia'],
      signals: ['hiring_surge'],
    },
    personas: [{ title: 'VP Finance' }],
  }

  it('maps industries to Apollo param', () => {
    const params = buildApolloSearchParams(icp)
    expect(params.organization_industries).toEqual(['SaaS', 'Fintech'])
  })

  it('formats employee range as "min,max" string', () => {
    const params = buildApolloSearchParams(icp)
    expect(params.organization_num_employees_ranges).toEqual(['50,500'])
  })

  it('maps geographies to Apollo param', () => {
    const params = buildApolloSearchParams(icp)
    expect(params.organization_locations).toEqual(['India', 'Southeast Asia'])
  })

  it('sets page 1 and per_page 25', () => {
    const params = buildApolloSearchParams(icp)
    expect(params.page).toBe(1)
    expect(params.per_page).toBe(25)
  })
})
