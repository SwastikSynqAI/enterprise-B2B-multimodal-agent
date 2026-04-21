import { readFileSync, writeFileSync } from 'fs'

export function readEngineFile(params: { path: string }): string {
  return readFileSync(params.path, 'utf-8')
}

export function writeWorkflowFile(params: { path: string; content: string }): void {
  writeFileSync(params.path, params.content, 'utf-8')
  console.log(`[SuperAgent:FilesystemTools] Wrote ${params.path}`)
}
