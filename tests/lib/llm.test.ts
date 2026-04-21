import { describe, it, expect } from 'vitest'
import { buildLLMClient } from '../../src/lib/llm.js'
import type { ModelConfig } from '../../src/lib/config.js'

describe('buildLLMClient', () => {
  it('returns an object with a chat function for anthropic', () => {
    const cfg: ModelConfig = {
      provider: 'anthropic',
      model: 'claude-haiku-4-5-20251001',
      api_key_env: 'ANTHROPIC_API_KEY',
      base_url: null,
    }
    const client = buildLLMClient(cfg)
    expect(typeof client.chat).toBe('function')
  })

  it('returns an object with a chat function for openai', () => {
    const cfg: ModelConfig = {
      provider: 'openai',
      model: 'gpt-4o',
      api_key_env: 'OPENAI_API_KEY',
      base_url: null,
    }
    const client = buildLLMClient(cfg)
    expect(typeof client.chat).toBe('function')
  })

  it('returns an object with a chat function for ollama (base_url set)', () => {
    const cfg: ModelConfig = {
      provider: 'ollama',
      model: 'llama3.2',
      api_key_env: 'OLLAMA_API_KEY',
      base_url: 'http://localhost:11434',
    }
    const client = buildLLMClient(cfg)
    expect(typeof client.chat).toBe('function')
  })

  it('throws on unsupported provider', () => {
    const cfg = {
      provider: 'unknown' as any,
      model: 'x',
      api_key_env: 'X',
      base_url: null,
    }
    expect(() => buildLLMClient(cfg)).toThrow('Unsupported LLM provider: unknown')
  })
})
