import { describe, it, expect } from 'vitest'
import { existsSync } from 'fs'
import { resolve } from 'path'

describe('project structure', () => {
  it('prisma schema exists', () => {
    expect(existsSync(resolve('packages/database/prisma/schema.prisma'))).toBe(true)
  })
  it('.env.example exists', () => {
    expect(existsSync(resolve('.env.example'))).toBe(true)
  })
})
