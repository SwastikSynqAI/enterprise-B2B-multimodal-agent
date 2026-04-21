export async function adjustAlertThreshold(params: {
  check: string
  threshold: number
}): Promise<void> {
  console.log(
    `[SuperAgent:MonitoringTools] Alert threshold for ${params.check} set to ${params.threshold}`
  )
}
