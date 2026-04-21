import { loadConfig } from '../../../lib/config.js'
import { buildLLMClient } from '../../../lib/llm.js'
import type { AgentState } from '../state.js'

export async function reasonNode(state: AgentState): Promise<Partial<AgentState>> {
  const config = loadConfig()
  const llm = buildLLMClient(config.model)

  const system = `You are an autonomous BD operations agent. Analyze the current system state and decide what optimizations to make. Be conservative — only act when there is clear evidence of underperformance. Available tools: adjustConnectionLimit, upsertMessageTemplate, adjustScoringThreshold, updateGTMPromptAngle, adjustAlertThreshold, readEngineFile, writeWorkflowFile. Respond with your reasoning in plain text.`

  const reasoning = await llm.chat(
    [
      {
        role: 'user',
        content: `Current state:\n${state.context}\n\nWhat should be optimized and why?`,
      },
    ],
    system
  )

  return { reasoning }
}
