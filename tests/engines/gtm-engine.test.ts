import { describe, it, expect } from 'vitest'
import { buildBlogPrompt } from '../../src/engines/gtm-engine/orchestrator.js'

describe('buildBlogPrompt', () => {
  it('includes the company name in the prompt', () => {
    const prompt = buildBlogPrompt('Acme Corp', 'MARKET_EXPANSION', ['hiring_surge'])
    expect(prompt).toContain('Acme Corp')
  })

  it('includes the prediction type (lowercased)', () => {
    const prompt = buildBlogPrompt('Acme Corp', 'MARKET_EXPANSION', ['hiring_surge'])
    expect(prompt).toContain('market expansion')
  })

  it('includes signals in the prompt', () => {
    const prompt = buildBlogPrompt('Acme Corp', 'BUYING_INTENT', ['funding_round', 'new_office'])
    expect(prompt).toContain('funding_round')
    expect(prompt).toContain('new_office')
  })
})
