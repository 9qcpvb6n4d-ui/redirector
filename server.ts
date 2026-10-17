import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to determine resource type from URL/domain
function inferResourceType(urlStr: string, textSnippet: string): string {
  const lower = (urlStr + ' ' + textSnippet).toLowerCase();
  if (lower.includes('github.com/')) return 'github';
  if (
    lower.includes('openai.com') ||
    lower.includes('anthropic.com') ||
    lower.includes('huggingface.co') ||
    lower.includes('cursor.com') ||
    lower.includes('midjourney.com') ||
    lower.includes('v0.dev') ||
    lower.includes('claude.ai') ||
    lower.includes('gemini.google') ||
    lower.includes('replicate.com')
  ) {
    return 'ai_tool';
  }
  if (
    lower.includes('docs.') ||
    lower.includes('/docs') ||
    lower.includes('documentation') ||
    lower.includes('developer.mozilla.org')
  ) {
    return 'docs';
  }
  if (lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo.com')) {
    return 'video';
  }
  if (
    lower.includes('coursera.org') ||
    lower.includes('udemy.com') ||
    lower.includes('edx.org') ||
    lower.includes('freecodecamp.org')
  ) {
    return 'course';
  }
  if (lower.includes('tutorial') || lower.includes('howto') || lower.includes('guide')) {
    return 'tutorial';
  }
  if (lower.includes('api.') || lower.includes('/api') || lower.includes('swagger') || lower.includes('postman')) {
    return 'api';
  }
  if (lower.includes('medium.com') || lower.includes('dev.to') || lower.includes('/blog/') || lower.includes('substack.com')) {
    return 'article';
  }
  return 'website';
}

// 1. Scrape metadata endpoint
app.get('/api/scrape-metadata', async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ success: false, error: 'Missing url query parameter' });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid URL format' });
  }

  const hostname = parsedUrl.hostname.replace(/^www\./, '');
  const fallbackFavicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;

  // Check if it's a GitHub repository
  const ghMatch = parsedUrl.pathname.match(/^\/([^/]+)\/([^/]+)(?:\/|$)/);
  if (hostname === 'github.com' && ghMatch && ghMatch[1] && ghMatch[2] && !['settings', 'pulls', 'issues', 'notifications', 'explore'].includes(ghMatch[1])) {
    const owner = ghMatch[1];
    const repo = ghMatch[2].replace(/\.git$/, '');
    try {
      const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'User-Agent': 'MySpace-Personal-Internet/1.0',
          Accept: 'application/vnd.github.v3+json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (ghRes.ok) {
        const repoData = await ghRes.json();
        return res.json({
          success: true,
          metadata: {
            title: `${repoData.full_name}`,
            description: repoData.description || 'Public GitHub repository',
            domain: 'github.com',
            faviconUrl: 'https://github.githubassets.com/favicons/favicon.svg',
            resourceType: 'github',
            githubData: {
              name: repoData.name,
              owner: repoData.owner?.login,
              stars: repoData.stargazers_count,
              language: repoData.language || 'Unknown',
              forks: repoData.forks_count,
              lastUpdate: repoData.updated_at,
            },
          },
        });
      }
    } catch (ghErr) {
      console.warn('GitHub API lookup timed out or failed, falling back to standard scraper', ghErr);
    }
  }

  // Standard web scraper
  try {
    const pageRes = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MySpaceLinkBot/1.0; +https://myspace.local)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(6000),
      redirect: 'follow',
    });

    const html = await pageRes.text();

    // Extract title
    let title = '';
    const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      title = ogTitleMatch[1].trim();
    } else {
      const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleTagMatch && titleTagMatch[1]) {
        title = titleTagMatch[1].trim();
      }
    }

    // Extract description
    let description = '';
    const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
    if (ogDescMatch && ogDescMatch[1]) {
      description = ogDescMatch[1].trim();
    } else {
      const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
      if (metaDescMatch && metaDescMatch[1]) {
        description = metaDescMatch[1].trim();
      }
    }

    // Extract favicon
    let faviconUrl = fallbackFavicon;
    const iconMatch = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i) ||
                      html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i);
    if (iconMatch && iconMatch[1]) {
      const rawIcon = iconMatch[1].trim();
      try {
        faviconUrl = new URL(rawIcon, parsedUrl.origin).toString();
      } catch {
        faviconUrl = fallbackFavicon;
      }
    }

    // Unescape HTML entities
    const unescapeHtml = (str: string) =>
      str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'");

    const cleanTitle = unescapeHtml(title || hostname);
    const cleanDesc = unescapeHtml(description || `Saved from ${hostname}`);
    const resourceType = inferResourceType(parsedUrl.toString(), cleanTitle + ' ' + cleanDesc);

    return res.json({
      success: true,
      metadata: {
        title: cleanTitle.slice(0, 200),
        description: cleanDesc.slice(0, 500),
        domain: hostname,
        faviconUrl,
        resourceType,
        githubData: null,
      },
    });
  } catch (err) {
    // If external site failed or blocked scraping, return healthy fallback data
    return res.json({
      success: true,
      fallback: true,
      metadata: {
        title: hostname,
        description: `Resource from ${hostname}`,
        domain: hostname,
        faviconUrl: fallbackFavicon,
        resourceType: inferResourceType(parsedUrl.toString(), ''),
        githubData: null,
      },
    });
  }
});

// 2. Android Web Share Target POST Handler
app.post('/api/share-target', (req: Request, res: Response) => {
  const { url, title, text } = req.body;
  const targetUrl = url || (text && text.startsWith('http') ? text : '');
  const searchParams = new URLSearchParams();
  if (targetUrl) searchParams.set('shared_url', targetUrl);
  if (title) searchParams.set('shared_title', title);
  if (text && text !== targetUrl) searchParams.set('shared_text', text);

  return res.redirect(`/?${searchParams.toString()}`);
});

// Vite middleware or static serving
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`MySpace running at http://0.0.0.0:${port}`);
  });
}

startServer();
