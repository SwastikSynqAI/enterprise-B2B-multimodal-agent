import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import type { ModelConfig } from './config.js'

export interface LLMMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface LLMClient {
  chat(messages: LLMMessage[], system?: string): Promise<string>
}

export function buildLLMClient(config: ModelConfig): LLMClient {
  const apiKey = process.env[config.api_key_env] ?? ''

  if (config.provider === 'anthropic') {
    const client = new Anthropic({ apiKey })
    return {
      async chat(messages, system) {
        const res = await client.messages.create({
          model: config.model,
          max_tokens: 2048,
          system,
          messages,
        })
        return (res.content[0] as { text: string }).text
      },
    }
  }

  if (['openai', 'groq', 'mistral', 'ollama'].includes(config.provider)) {
    const client = new OpenAI({
      apiKey,
      baseURL: config.base_url ?? undefined,
    })
    return {
      async chat(messages, system) {
        const all = system
          ? [{ role: 'system' as const, content: system }, ...messages]
          : messages
        const res = await client.chat.completions.create({
          model: config.model,
          messages: all,
        })
        return res.choices[0].message.content ?? ''
      },
    }
  }

  throw new Error(`Unsupported LLM provider: ${config.provider}`)
}
