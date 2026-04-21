import { readFileSync } from 'fs'
import { resolve } from 'path'
import yaml from 'js-yaml'

export interface ICPConfig {
  company: {
    industries: string[]
    employee_range: [number, number]
    geographies: string[]
    signals: string[]
  }
  personas: Array<{ title: string }>
}

export interface PredictionType {
  name: string
  description: string
  signals: string[]
  weight: number
}

export interface PredictionsConfig {
  prediction_types: PredictionType[]
  scoring: { horizons: number[]; min_score_threshold: number; top_n: number }
}

export interface OutreachConfig {
  linkedin: {
    daily_connection_limit: number
    enabled: boolean
    connection_request: string
    follow_up_days: number
    follow_up: string
  }
  email: {
    enabled: boolean
    from_name: string
    from_email: string
    subject: string
    body_template: string
    follow_up_days: number
  }
}

export interface SourcesConfig {
  sources: {
    hackernews: boolean
    newsapi: boolean
    gnews: boolean
    sec_edgar: boolean
    finnhub: boolean
    alpha_vantage: boolean
    opencorporates: boolean
    rss_feeds: Array<{ url: string; tags: string[] }>
  }
}

export interface ModelConfig {
  provider: 'anthropic' | 'openai' | 'groq' | 'mistral' | 'ollama'
  model: string
  api_key_env: string
  base_url: string | null
}

export interface AppConfig {
  icp: ICPConfig
  predictions: PredictionsConfig
  outreach: OutreachConfig
  sources: SourcesConfig
  model: ModelConfig
}

function loadYaml<T>(filename: string): T {
  const path = resolve('config', filename)
  const raw = readFileSync(path, 'utf-8')
  return yaml.load(raw) as T
}

export function loadConfig(): AppConfig {
  return {
    icp: loadYaml<ICPConfig>('icp.yaml'),
    predictions: loadYaml<PredictionsConfig>('predictions.yaml'),
    outreach: loadYaml<OutreachConfig>('outreach.yaml'),
    sources: loadYaml<SourcesConfig>('sources.yaml'),
    model: loadYaml<ModelConfig>('model.yaml'),
  }
}
