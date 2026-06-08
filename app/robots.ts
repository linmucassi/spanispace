import type { MetadataRoute } from 'next';

const PRIVATE_PATHS = ['/admin/', '/candidate/', '/company/', '/callback', '/forgot-password', '/reset-password'];

// Major AI / search crawlers we explicitly want to opt in.
// Default rule (userAgent: '*') also allows them; this section makes intent explicit
// and surfaces well in robots.txt audits.
const AI_BOTS = [
  'GPTBot',           // OpenAI training crawler
  'OAI-SearchBot',    // ChatGPT search index
  'ChatGPT-User',     // ChatGPT browsing on a user's behalf
  'ClaudeBot',        // Anthropic training crawler
  'Claude-Web',       // Anthropic web fetcher
  'Claude-User',      // Claude browsing on a user's behalf
  'anthropic-ai',     // Anthropic legacy
  'PerplexityBot',    // Perplexity index
  'Perplexity-User',  // Perplexity browsing on a user's behalf
  'Google-Extended',  // Google Gemini training opt-in
  'Applebot-Extended',// Apple Intelligence training opt-in
  'Bytespider',       // ByteDance / Doubao
  'CCBot',            // Common Crawl (feeds many LLM training sets)
  'Meta-ExternalAgent', // Meta AI training
  'DuckAssistBot',    // DuckDuckGo AI answers
  'cohere-ai',        // Cohere
  'Diffbot',          // Knowledge graph
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
      ...AI_BOTS.map((bot) => ({
        userAgent: bot,
        allow: '/',
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: 'https://spanispace.com/sitemap.xml',
    host: 'https://spanispace.com',
  };
}
