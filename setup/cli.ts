import { input, select, confirm, password } from '@inquirer/prompts'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import chalk from 'chalk'
import yaml from 'js-yaml'

const PROVIDER_MAP: Record<string, { env: string; model: string }> = {
  anthropic: { env: 'ANTHROPIC_API_KEY', model: 'claude-sonnet-4-6' },
  openai: { env: 'OPENAI_API_KEY', model: 'gpt-4o' },
  groq: { env: 'GROQ_API_KEY', model: 'llama-3.1-70b-versatile' },
  mistral: { env: 'MISTRAL_API_KEY', model: 'mistral-large-latest' },
  ollama: { env: 'OLLAMA_API_KEY', model: 'llama3.2' },
}

async function main() {
  console.log(chalk.bold.blue('\n enterprise-bd-os setup\n'))
  console.log('This will generate your config files and .env in ~3 minutes.\n')

  const companyName = await input({ message: 'Your company name:' })

  const industriesRaw = await input({
    message: 'Industries you sell into (comma-separated):',
    default: 'SaaS, Fintech, Logistics',
  })

  const geosRaw = await input({
    message: 'Target geographies (comma-separated):',
    default: 'India, Southeast Asia',
  })

  const empMin = await input({ message: 'Min company size (employees):', default: '50' })
  const empMax = await input({ message: 'Max company size (employees):', default: '500' })

  const provider = await select({
    message: 'LLM provider:',
    choices: [
      { name: 'Anthropic (Claude)', value: 'anthropic' },
      { name: 'OpenAI (GPT)', value: 'openai' },
      { name: 'Groq', value: 'groq' },
      { name: 'Mistral', value: 'mistral' },
      { name: 'Ollama (local)', value: 'ollama' },
    ],
  })

  const llmKey = provider !== 'ollama'
    ? await password({ message: `${provider} API key:`, mask: '*' })
    : ''

  const apolloKey = await password({ message: 'Apollo API key (lead discovery):', mask: '*' })
  const newsapiKey = await password({ message: 'NewsAPI key (press Enter to skip):', mask: '*' })
  const smtpHost = await input({ message: 'SMTP host (press Enter to skip):', default: '' })
  const smtpUser = smtpHost ? await input({ message: 'SMTP username:' }) : ''
  const smtpPass = smtpHost ? await password({ message: 'SMTP password:', mask: '*' }) : ''
  const fromName = smtpHost ? await input({ message: 'From name for emails:' }) : companyName
  const fromEmail = smtpHost ? await input({ message: 'From email address:' }) : ''

  const linkedinOk = await confirm({
    message: chalk.yellow('Enable LinkedIn automation? (Playwright browser — use at your own risk, see docs/DISCLAIMER.md)'),
    default: false,
  })

  if (!existsSync('config')) mkdirSync('config')

  writeFileSync('config/icp.yaml', yaml.dump({
    company: {
      industries: industriesRaw.split(',').map((s: string) => s.trim()),
      employee_range: [parseInt(empMin), parseInt(empMax)],
      geographies: geosRaw.split(',').map((s: string) => s.trim()),
      signals: ['hiring_surge', 'funding_round', 'market_expansion', 'new_office'],
    },
    personas: [
      { title: 'Head of Operations' },
      { title: 'VP Finance' },
      { title: 'COO' },
    ],
  }))

  writeFileSync('config/model.yaml', yaml.dump({
    provider,
    model: PROVIDER_MAP[provider].model,
    api_key_env: PROVIDER_MAP[provider].env,
    base_url: provider === 'ollama' ? 'http://localhost:11434' : null,
  }))

  writeFileSync('config/predictions.yaml', yaml.dump({
    prediction_types: [
      { name: 'MARKET_EXPANSION', description: 'Company entering new markets', signals: ['new_office', 'hiring_surge', 'funding'], weight: 0.4 },
      { name: 'BUYING_INTENT', description: 'Company evaluating vendors', signals: ['job_posting_vendor', 'budget_cycle'], weight: 0.6 },
    ],
    scoring: { horizons: [30, 60, 90], min_score_threshold: 0.45, top_n: 50 },
  }))

  writeFileSync('config/outreach.yaml', yaml.dump({
    linkedin: {
      daily_connection_limit: 20,
      enabled: linkedinOk,
      connection_request: `Hi {{first_name}}, noticed {{company}} is {{signal_context}}. Would love to connect.`,
      follow_up_days: 5,
      follow_up: `Hi {{first_name}}, following up on my earlier message. Happy to share how we've helped similar companies.`,
    },
    email: {
      enabled: !!smtpHost,
      from_name: fromName,
      from_email: fromEmail,
      subject: 'Quick note for {{company}}',
      body_template: 'templates/email-intro.html',
      follow_up_days: 3,
    },
  }))

  writeFileSync('config/sources.yaml', yaml.dump({
    sources: {
      hackernews: true,
      newsapi: !!newsapiKey,
      gnews: false,
      sec_edgar: false,
      finnhub: false,
      alpha_vantage: false,
      opencorporates: false,
      rss_feeds: [
        { url: 'https://techcrunch.com/feed/', tags: ['funding', 'expansion'] },
      ],
    },
  }))

  const envLines = [
    `${PROVIDER_MAP[provider].env}=${llmKey}`,
    `APOLLO_API_KEY=${apolloKey}`,
    newsapiKey ? `NEWSAPI_KEY=${newsapiKey}` : '',
    smtpHost ? `SMTP_HOST=${smtpHost}` : '',
    smtpUser ? `SMTP_USER=${smtpUser}` : '',
    smtpPass ? `SMTP_PASS=${smtpPass}` : '',
    fromName ? `EMAIL_FROM_NAME=${fromName}` : '',
    fromEmail ? `EMAIL_FROM_ADDRESS=${fromEmail}` : '',
    `DATABASE_URL=file:${join(process.cwd(), 'data', 'bd.db')}`,
  ].filter(Boolean).join('\n')
  writeFileSync('.env', envLines)

  console.log(chalk.green('\n✓ Config files written to config/'))
  console.log(chalk.green('✓ .env written'))
  console.log(chalk.cyan('\nRun these commands to finish setup:'))
  console.log(chalk.white('  pnpm db:migrate --name init'))
  console.log(chalk.white('  pnpm db:generate'))
  console.log(chalk.white('  pnpm start\n'))
}

main().catch(console.error)
