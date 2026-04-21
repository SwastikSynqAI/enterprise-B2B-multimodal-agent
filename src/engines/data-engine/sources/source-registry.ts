import type { SourcesConfig } from '../../../lib/config.js'

export interface RawArticle {
  url: string
  title: string
  content?: string
  source: string
  publishedAt?: Date
}

export interface DataSource {
  name: string
  type: 'api' | 'rss'
  fetch(): Promise<RawArticle[]>
}

async function fetchHackerNews(): Promise<RawArticle[]> {
  const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
  const ids: number[] = await res.json()
  const top20 = ids.slice(0, 20)
  const results = await Promise.allSettled(
    top20.map(async (id) => {
      const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
      const item = await r.json()
      return {
        url: item.url ?? `https://news.ycombinator.com/item?id=${id}`,
        title: item.title ?? '',
        source: 'hackernews',
        publishedAt: item.time ? new Date(item.time * 1000) : undefined,
      } satisfies RawArticle
    })
  )
  return results
    .filter((r): r is PromiseFulfilledResult<RawArticle> => r.status === 'fulfilled')
    .map(r => r.value)
}

async function fetchNewsAPI(apiKey: string): Promise<RawArticle[]> {
  if (!apiKey) return []
  const url = `https://newsapi.org/v2/top-headlines?category=business&pageSize=20&apiKey=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) return []
  const json = await res.json()
  return (json.articles ?? []).map((a: Record<string, unknown>) => ({
    url: a.url as string,
    title: (a.title as string) ?? '',
    content: a.description as string | undefined,
    source: 'newsapi',
    publishedAt: a.publishedAt ? new Date(a.publishedAt as string) : undefined,
  }))
}

async function fetchRSS(feedUrl: string, sourceName: string): Promise<RawArticle[]> {
  const Parser = (await import('rss-parser')).default
  const parser = new Parser()
  const feed = await parser.parseURL(feedUrl)
  return (feed.items ?? []).slice(0, 15).map(item => ({
    url: item.link ?? '',
    title: item.title ?? '',
    content: item.contentSnippet,
    source: sourceName,
    publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
  }))
}

export function getEnabledSources(cfg: SourcesConfig): DataSource[] {
  const sources: DataSource[] = []
  const s = cfg.sources

  if (s.hackernews) {
    sources.push({ name: 'hackernews', type: 'api', fetch: fetchHackerNews })
  }
  if (s.newsapi) {
    sources.push({
      name: 'newsapi',
      type: 'api',
      fetch: () => fetchNewsAPI(process.env.NEWSAPI_KEY ?? ''),
    })
  }
  for (const feed of (s.rss_feeds ?? [])) {
    const sourceName = new URL(feed.url).hostname
    sources.push({
      name: sourceName,
      type: 'rss',
      fetch: () => fetchRSS(feed.url, sourceName),
    })
  }

  return sources
}
