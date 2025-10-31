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
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    source: 'TechCrunch AI',
  },
  {
    url: 'https://venturebeat.com/category/ai/feed/',
    source: 'VentureBeat AI',
  },
  {
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
    source: 'MIT Tech Review AI',
  },
  {
    url: 'https://blogs.nvidia.com/feed/',
    source: 'NVIDIA Blog',
  },
  {
    url: 'https://openai.com/blog/rss.xml',
    source: 'OpenAI Blog',
  },
  {
    url: 'https://ai.googleblog.com/feeds/posts/default',
    source: 'Google AI Blog',
  },
];

export async function scrapeRSSFeeds(): Promise<Article[]> {
  const allArticles: Article[] = [];

  for (const feed of RSS_FEEDS) {
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
