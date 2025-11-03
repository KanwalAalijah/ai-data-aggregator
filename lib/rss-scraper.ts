import Parser from 'rss-parser';

export interface Article {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  source: string;
  categories?: string[];
}

const parser = new Parser({
  customFields: {
    item: ['content:encoded', 'content', 'description', 'summary'],
  },
});

// AI-related RSS feeds
const RSS_FEEDS = [
  {
    id: 'techcrunch',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    source: 'TechCrunch AI',
  },
  {
    id: 'venturebeat',
    url: 'https://venturebeat.com/category/ai/feed/',
    source: 'VentureBeat AI',
  },
  {
    id: 'mit',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
    source: 'MIT Tech Review AI',
  },
  {
    id: 'nvidia',
    url: 'https://blogs.nvidia.com/feed/',
    source: 'NVIDIA Blog',
  },
  {
    id: 'openai',
    url: 'https://openai.com/blog/rss.xml',
    source: 'OpenAI Blog',
  },
  {
    id: 'google',
    url: 'https://ai.googleblog.com/feeds/posts/default',
    source: 'Google AI Blog',
  },
  {
    id: 'guardian',
    url: 'https://www.theguardian.com/technology/artificialintelligenceai/rss',
    source: 'The Guardian AI',
  },
];

export async function scrapeRSSFeeds(selectedSources?: string[]): Promise<Article[]> {
  const allArticles: Article[] = [];

  // Filter feeds based on selected sources
  const feedsToScrape = selectedSources && selectedSources.length > 0
    ? RSS_FEEDS.filter(feed => selectedSources.includes(feed.id))
    : RSS_FEEDS;

  for (const feed of feedsToScrape) {
    try {
      console.log(`Fetching from ${feed.source}...`);
      const feedData = await parser.parseURL(feed.url);

      const articles = feedData.items.map((item) => ({
        title: item.title || 'No title',
        link: item.link || '',
        pubDate: item.pubDate || new Date().toISOString(),
        content:
          (item as any)['content:encoded'] ||
          (item as any).content ||
          item.contentSnippet ||
          item.summary ||
          item.description ||
          '',
        source: feed.source,
        categories: item.categories || [],
      }));

      allArticles.push(...articles);
      console.log(`Fetched ${articles.length} articles from ${feed.source}`);
    } catch (error) {
      console.error(`Error fetching ${feed.source}:`, error);
    }
  }

  // Sort by publication date (newest first)
  allArticles.sort((a, b) =>
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  return allArticles;
}
