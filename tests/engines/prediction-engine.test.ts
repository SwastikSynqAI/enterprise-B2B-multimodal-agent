import { describe, it, expect } from 'vitest'
import { scoreCompany } from '../../src/engines/prediction-engine/orchestrator.js'
import type { PredictionType } from '../../src/lib/config.js'

describe('scoreCompany', () => {
  const predictionTypes: PredictionType[] = [
    {
      name: 'MARKET_EXPANSION',
      description: 'Company entering new markets',
      signals: ['hiring_surge', 'funding', 'new_office'],
      weight: 1.0,
    },
  ]

  it('returns a score > 0 when signals match', () => {
    const score = scoreCompany(['hiring_surge', 'funding'], predictionTypes, 30)
    expect(score).toBeGreaterThan(0)
  })

  it('returns 0 when no signals provided', () => {
    const score = scoreCompany([], predictionTypes, 30)
    expect(score).toBe(0)
  })

  it('returns a lower score for 90-day horizon vs 30-day', () => {
    const score30 = scoreCompany(['hiring_surge', 'funding'], predictionTypes, 30)
    const score90 = scoreCompany(['hiring_surge', 'funding'], predictionTypes, 90)
    expect(score30).toBeGreaterThan(score90)
  })

  it('score is clamped to max 1.0', () => {
    const manySignals = Array(20).fill('hiring_surge')
    const score = scoreCompany(manySignals, predictionTypes, 30)
    expect(score).toBeLessThanOrEqual(1.0)
  })

  it('returns 0 when signals do not match prediction type', () => {
    const score = scoreCompany(['unrelated_signal'], predictionTypes, 30)
    expect(score).toBe(0)
  })
})
