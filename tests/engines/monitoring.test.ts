import { describe, it, expect } from 'vitest'
import { computeOverallStatus } from '../../src/engines/monitoring/health-check.js'

describe('computeOverallStatus', () => {
  it('returns HEALTHY when all checks pass', () => {
    const checks = [
      { name: 'data', status: 'ok' as const },
      { name: 'bd', status: 'ok' as const },
    ]
    expect(computeOverallStatus(checks)).toBe('HEALTHY')
  })

  it('returns DEGRADED when some checks warn', () => {
    const checks = [
      { name: 'data', status: 'ok' as const },
      { name: 'bd', status: 'warn' as const },
    ]
    expect(computeOverallStatus(checks)).toBe('DEGRADED')
  })

  it('returns DOWN when any check fails', () => {
    const checks = [
      { name: 'data', status: 'fail' as const },
      { name: 'bd', status: 'ok' as const },
    ]
    expect(computeOverallStatus(checks)).toBe('DOWN')
  })

  it('DOWN takes priority over DEGRADED', () => {
    const checks = [
      { name: 'data', status: 'warn' as const },
      { name: 'bd', status: 'fail' as const },
    ]
    expect(computeOverallStatus(checks)).toBe('DOWN')
  })
})
