import { adjustConnectionLimit, upsertMessageTemplate } from './bd-tools.js'
import { updateGTMPromptAngle } from './gtm-tools.js'
import { adjustScoringThreshold } from './prediction-tools.js'
import { adjustAlertThreshold } from './monitoring-tools.js'
import { readEngineFile, writeWorkflowFile } from './filesystem-tools.js'
import { isWeekend, clampConnectionLimit } from './guardrails.js'

const TOOL_MAP: Record<string, (params: Record<string, unknown>) => Promise<unknown> | unknown> = {
  adjustConnectionLimit: (p) => adjustConnectionLimit(p as { limit: number }),
  upsertMessageTemplate: (p) => upsertMessageTemplate(p as { channel: string; content: string }),
  updateGTMPromptAngle: (p) => updateGTMPromptAngle(p as { angle: string }),
  adjustScoringThreshold: (p) => adjustScoringThreshold(p as { threshold: number }),
  adjustAlertThreshold: (p) =>
    adjustAlertThreshold(p as { check: string; threshold: number }),
  readEngineFile: (p) => readEngineFile(p as { path: string }),
  writeWorkflowFile: (p) =>
    writeWorkflowFile(p as { path: string; content: string }),
  isWeekend: () => isWeekend(),
  clampConnectionLimit: (p) => clampConnectionLimit((p as { n: number }).n),
}

export async function executeTool(
  tool: string,
  params: Record<string, unknown>
): Promise<unknown> {
  const fn = TOOL_MAP[tool]
  if (!fn) throw new Error(`Unknown tool: ${tool}`)
  return fn(params)
}
