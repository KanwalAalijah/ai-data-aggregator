import * as cheerio from 'cheerio';

export interface WebDocument {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  source: string;
  categories?: string[];
}

// Static web pages to scrape
const WEB_PAGES = [
  {
    id: 'google-ai-principles',
    url: 'https://ai.google/responsibility/principles/',
    source: 'Google AI Principles',
  },
  {
    id: 'oecd-ai-principles',
    url: 'https://oecd.ai/en/ai-principles',
    source: 'OECD AI Principles',
  },
  {
    id: 'eu-ai-guidelines',
    url: 'https://digital-strategy.ec.europa.eu/en/library/commission-publishes-guidelines-ai-system-definition-facilitate-first-ai-acts-rules-application',
    source: 'EU AI Guidelines',
  },
];

async function fetchWebPage(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIResearchBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

function extractTextContent(html: string): string {
  const $ = cheerio.load(html);

  // Remove script, style, and other non-content elements
  $('script, style, nav, header, footer, iframe, noscript').remove();

  // Try to find main content area
  const mainContent =
    $('main').text() ||
    $('article').text() ||
    $('.content').text() ||
    $('#content').text() ||
    $('body').text();

  // Clean up whitespace
  return mainContent
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}

function extractTitle(html: string, url: string): string {
  const $ = cheerio.load(html);

  // Try multiple title extraction methods
  const title =
    $('title').text() ||
    $('h1').first().text() ||
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="title"]').attr('content') ||
    'Untitled Document';

  return title.trim();
}

export async function scrapeWebPages(selectedSources?: string[]): Promise<WebDocument[]> {
  const allDocuments: WebDocument[] = [];

  // Filter pages based on selected sources
  const pagesToScrape = selectedSources && selectedSources.length > 0
    ? WEB_PAGES.filter(page => selectedSources.includes(page.id))
    : WEB_PAGES;

  for (const page of pagesToScrape) {
    try {
      console.log(`Scraping ${page.source}...`);
      const html = await fetchWebPage(page.url);
      const title = extractTitle(html, page.url);
      const content = extractTextContent(html);

      // Only add if we got meaningful content
      if (content && content.length > 100) {
        allDocuments.push({
          title,
          link: page.url,
          pubDate: new Date().toISOString(), // Use current date for static pages
          content: content.substring(0, 5000), // Limit content length
          source: page.source,
          categories: ['AI Principles', 'Guidelines'],
        });
        console.log(`Successfully scraped ${page.source} (${content.length} chars)`);
      } else {
        console.log(`Skipped ${page.source} - insufficient content`);
      }
    } catch (error) {
      console.error(`Error scraping ${page.source}:`, error);
    }
  }

  return allDocuments;
}
