export const VALID_TOOLS = [
  'adjustConnectionLimit',
  'upsertMessageTemplate',
  'adjustScoringThreshold',
  'updateGTMPromptAngle',
  'adjustAlertThreshold',
  'readEngineFile',
  'writeWorkflowFile',
  'isWeekend',
  'clampConnectionLimit',
] as const

export type ValidTool = (typeof VALID_TOOLS)[number]

export function isWeekend(): boolean {
  const day = new Date().getDay()
  return day === 0 || day === 6
}

export function clampConnectionLimit(n: number): number {
  return Math.max(1, Math.min(50, n))
}
