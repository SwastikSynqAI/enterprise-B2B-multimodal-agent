import type { AgentState, ActionItem } from '../state.js'
import { executeTool } from '../tools/index.js'

export async function actNode(state: AgentState): Promise<Partial<AgentState>> {
  const executed: ActionItem[] = []
  for (const action of state.actions) {
    try {
      await executeTool(action.tool, action.parameters)
      executed.push(action)
      console.log(`[SuperAgent] Executed: ${action.tool} — ${action.rationale}`)
    } catch (err) {
      console.error(`[SuperAgent] Tool failed: ${action.tool}`, err)
    }
  }
  return { executed }
}
