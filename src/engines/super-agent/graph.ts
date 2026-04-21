import { StateGraph, Annotation, END, START } from '@langchain/langgraph'
import type { ActionItem } from './state.js'
import { readNode } from './nodes/read.js'
import { reasonNode } from './nodes/reason.js'
import { planNode } from './nodes/plan.js'
import { actNode } from './nodes/act.js'
import { logNode } from './nodes/log.js'

const AgentAnnotation = Annotation.Root({
  trigger: Annotation<string>({
    reducer: (_c, u) => u ?? _c,
    default: () => '',
  }),
  context: Annotation<string>({
    reducer: (_c, u) => u ?? _c,
    default: () => '',
  }),
  reasoning: Annotation<string>({
    reducer: (_c, u) => u ?? _c,
    default: () => '',
  }),
  actions: Annotation<ActionItem[]>({
    reducer: (_c, u) => u ?? _c,
    default: () => [],
  }),
  executed: Annotation<ActionItem[]>({
    reducer: (_c, u) => u ?? _c,
    default: () => [],
  }),
  runId: Annotation<string>({
    reducer: (_c, u) => u ?? _c,
    default: () => '',
  }),
})

export function buildSuperAgentGraph() {
  // Chain addNode calls so TypeScript tracks the growing N union type,
  // then addEdge calls can reference all registered node names.
  const graph = new StateGraph(AgentAnnotation)
    .addNode('read', readNode)
    .addNode('reason', reasonNode)
    .addNode('plan', planNode)
    .addNode('act', actNode)
    .addNode('log', logNode)
    .addEdge(START, 'read')
    .addEdge('read', 'reason')
    .addEdge('reason', 'plan')
    .addEdge('plan', 'act')
    .addEdge('act', 'log')
    .addEdge('log', END)

  return graph.compile()
}
