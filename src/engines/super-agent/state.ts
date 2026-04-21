export interface ActionItem {
  tool: string
  parameters: Record<string, unknown>
  rationale: string
}

export interface AgentState {
  trigger: string
  context: string
  reasoning: string
  actions: ActionItem[]
  executed: ActionItem[]
  runId: string
}
