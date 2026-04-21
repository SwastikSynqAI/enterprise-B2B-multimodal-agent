import { loadConfig } from '../../../lib/config.js'
import { buildLLMClient } from '../../../lib/llm.js'
import type { AgentState, ActionItem } from '../state.js'
import { isWeekend, VALID_TOOLS } from '../tools/guardrails.js'

export async function planNode(state: AgentState): Promise<Partial<AgentState>> {
  const config = loadConfig()
  const llm = buildLLMClient(config.model)

  const system = `Based on the reasoning provided, output a JSON array of actions to take. Each action: { "tool": string, "parameters": object, "rationale": string }. Only use these tools: ${VALID_TOOLS.join(', ')}. On weekends, do NOT include adjustConnectionLimit or upsertMessageTemplate. Return ONLY the JSON array, no markdown fences.`

  const response = await llm.chat(
    [
      {
        role: 'user',
        content: `Reasoning:\n${state.reasoning}\n\nGenerate the action plan as a JSON array.`,
      },
    ],
    system
  )

  let actions: ActionItem[] = []
  try {
    const cleaned = response.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) {
      actions = parsed.filter(a => (VALID_TOOLS as readonly string[]).includes(a.tool))
    }
  } catch {
    actions = []
  }

  if (isWeekend()) {
    actions = actions.filter(
      a => !['adjustConnectionLimit', 'upsertMessageTemplate'].includes(a.tool)
    )
  }

  return { actions }
}
