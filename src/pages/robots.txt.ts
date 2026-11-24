import type { APIRoute } from 'astro';
import { SITE } from '../../site.config.mjs';

/**
 * Robots.txt configuration for search engines and AI discovery.
 * Explicitly welcomes search engine crawlers (Google, Bing, DuckDuckGo, Yahoo, Apple)
 * and AI search / citation / answer engine bots (Perplexity, OpenAI, Anthropic, Applebot-Extended, etc.).
 */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap.xml', site).toString();

  const body = `# JNB Events Robots.txt
# ${new URL(SITE).host}/

# Primary search engine crawlers (Google, Bing, DuckDuckGo, Yahoo, Apple)
User-agent: Googlebot
User-agent: Bingbot
User-agent: DuckDuckBot
User-agent: Slurp
User-agent: Applebot
User-agent: YandexBot
User-agent: SeznamBot
User-agent: *
Allow: /

# AI search, citation, and conversational answer engines
User-agent: PerplexityBot
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: ClaudeBot
User-agent: Claude-Web
User-agent: anthropic-ai
User-agent: Applebot-Extended
User-agent: Meta-ExternalAgent
User-agent: cohere-ai
User-agent: GPTBot
User-agent: Google-Extended
Allow: /

# XML Sitemap
Sitemap: ${sitemap}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
