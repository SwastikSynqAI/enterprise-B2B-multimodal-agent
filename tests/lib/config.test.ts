import { describe, it, expect } from 'vitest'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { loadConfig } from '../../src/lib/config.js'

describe('project structure', () => {
  it('prisma schema exists', () => {
    expect(existsSync(resolve('packages/database/prisma/schema.prisma'))).toBe(true)
  })
  it('.env.example exists', () => {
    expect(existsSync(resolve('.env.example'))).toBe(true)
  })
})

describe('loadConfig', () => {
  it('loads icp industries', () => {
    const cfg = loadConfig()
    expect(cfg.icp.company.industries).toBeInstanceOf(Array)
    expect(cfg.icp.company.industries.length).toBeGreaterThan(0)
  })
  it('loads model provider', () => {
    const cfg = loadConfig()
    expect(cfg.model.provider).toMatch(/anthropic|openai|groq|mistral|ollama/)
  })
  it('loads prediction types', () => {
    const cfg = loadConfig()
    expect(cfg.predictions.prediction_types.length).toBeGreaterThan(0)
  })
  it('loads outreach config with enabled flags', () => {
    const cfg = loadConfig()
    expect(typeof cfg.outreach.linkedin.enabled).toBe('boolean')
    expect(typeof cfg.outreach.email.enabled).toBe('boolean')
  })
})
