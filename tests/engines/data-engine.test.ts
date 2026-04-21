import { describe, it, expect } from 'vitest'
import { tagArticle } from '../../src/engines/data-engine/ingest.js'
import { getEnabledSources } from '../../src/engines/data-engine/sources/source-registry.js'
import type { SourcesConfig } from '../../src/lib/config.js'

describe('tagArticle', () => {
  it('tags an article matching hiring_surge', () => {
    const tags = tagArticle('Company announces 200 new hires as they expand', ['hiring_surge'])
    expect(tags).toContain('hiring_surge')
  })

  it('tags an article matching funding_round', () => {
    const tags = tagArticle('Startup raises Series B funding of $50M', ['funding_round'])
    expect(tags).toContain('funding_round')
  })

  it('returns empty array when no signals match', () => {
    const tags = tagArticle('Local sports team wins championship', ['hiring_surge', 'funding_round'])
    expect(tags).toEqual([])
  })

  it('matches multiple signals in one article', () => {
    const tags = tagArticle('Company raises Series A and announces new office expansion', ['funding_round', 'new_office'])
    expect(tags).toContain('funding_round')
    expect(tags).toContain('new_office')
  })
})

describe('getEnabledSources', () => {
  it('returns hackernews source when enabled', () => {
    const cfg: SourcesConfig = {
      sources: {
        hackernews: true,
        newsapi: false,
        gnews: false,
        sec_edgar: false,
        finnhub: false,
        alpha_vantage: false,
        opencorporates: false,
        rss_feeds: [],
      },
    }
    const sources = getEnabledSources(cfg)
    expect(sources.some(s => s.name === 'hackernews')).toBe(true)
    expect(sources.length).toBe(1)
  })

  it('returns rss source for each feed', () => {
    const cfg: SourcesConfig = {
      sources: {
        hackernews: false,
        newsapi: false,
        gnews: false,
        sec_edgar: false,
        finnhub: false,
        alpha_vantage: false,
        opencorporates: false,
        rss_feeds: [
          { url: 'https://techcrunch.com/feed/', tags: ['funding'] },
        ],
      },
    }
    const sources = getEnabledSources(cfg)
    expect(sources.length).toBe(1)
    expect(sources[0].type).toBe('rss')
  })
})
