# Setup Guide

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- An API key from one LLM provider (Anthropic, OpenAI, Groq, or Mistral)
- An Apollo.io API key for lead discovery

## Quick Setup (3 minutes)

```bash
git clone https://github.com/YOUR_USERNAME/enterprise-bd-os
cd enterprise-bd-os
pnpm install
pnpm run setup
```

The setup wizard will ask for your configuration and write all config files.

After setup:
```bash
pnpm db:migrate --name init
pnpm db:generate
pnpm start
```

## Manual Configuration

If you prefer to configure manually, copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
# Edit .env with your API keys
```

Then create the config files in `config/` — see each YAML file in that directory for documentation.

## Verifying Setup

```bash
pnpm test   # All tests should pass
pnpm start  # Should print: [enterprise-bd-os] All engines scheduled. Running...
```

## Troubleshooting

**Database errors:** Run `pnpm db:migrate --name init && pnpm db:generate`

**LLM errors:** Check your API key is set correctly in `.env` and matches `config/model.yaml`'s `api_key_env` field

**LinkedIn outreach not running:** Check `config/outreach.yaml` — `linkedin.enabled` must be `true`

**Email outreach not running:** Check `config/outreach.yaml` — `email.enabled` must be `true`, and SMTP credentials must be set in `.env`
