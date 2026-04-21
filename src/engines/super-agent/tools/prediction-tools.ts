export async function adjustScoringThreshold(params: { threshold: number }): Promise<void> {
  const safe = Math.max(0.1, Math.min(0.9, params.threshold))
  console.log(`[SuperAgent:PredictionTools] Scoring threshold set to ${safe}`)
}
