import { describe, it, expect } from 'vitest'
import { isWeekend, clampConnectionLimit, VALID_TOOLS } from '../../src/engines/super-agent/tools/guardrails.js'
import { executeTool } from '../../src/engines/super-agent/tools/index.js'

describe('guardrails', () => {
  it('VALID_TOOLS has exactly 9 entries', () => {
    expect(VALID_TOOLS).toHaveLength(9)
  })

  it('clampConnectionLimit enforces min 1 and max 50', () => {
    expect(clampConnectionLimit(100)).toBe(50)
    expect(clampConnectionLimit(0)).toBe(1)
    expect(clampConnectionLimit(20)).toBe(20)
  })

  it('isWeekend returns a boolean', () => {
    expect(typeof isWeekend()).toBe('boolean')
  })
})

describe('executeTool', () => {
  it('throws on unknown tool', async () => {
    await expect(executeTool('nonexistent', {})).rejects.toThrow('Unknown tool: nonexistent')
  })

  it('executes isWeekend tool', async () => {
    const result = await executeTool('isWeekend', {})
    expect(typeof result).toBe('boolean')
  })
})
