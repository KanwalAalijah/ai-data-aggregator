import Parser from 'rss-parser';

export interface ArxivPaper {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  authors: string[];
  source: string;
  categories?: string[];
}

const parser = new Parser({
  customFields: {
    item: ['author', 'arxiv:comment', 'summary'],
  },
});

// ArXiv AI/ML categories
const ARXIV_FEEDS = [
  {
    url: 'http://export.arxiv.org/rss/cs.AI',
    source: 'ArXiv - AI',
  },
  {
    url: 'http://export.arxiv.org/rss/cs.LG',
    source: 'ArXiv - Machine Learning',
  },
  {
    url: 'http://export.arxiv.org/rss/cs.CL',
    source: 'ArXiv - Computation and Language',
  },
  {
    url: 'http://export.arxiv.org/rss/cs.CV',
    source: 'ArXiv - Computer Vision',
  },
];

export async function fetchArxivPapers(): Promise<ArxivPaper[]> {
  const allPapers: ArxivPaper[] = [];

  for (const feed of ARXIV_FEEDS) {
    try {
      console.log(`Fetching from ${feed.source}...`);
      const feedData = await parser.parseURL(feed.url);

      const papers = feedData.items.map((item) => {
        // Extract authors from the item
        const authorField = (item as any).author || (item as any).creator || '';
        const authors = Array.isArray(authorField)
          ? authorField
          : [authorField].filter(Boolean);

        return {
          title: item.title || 'No title',
          link: item.link || '',
          pubDate: item.pubDate || new Date().toISOString(),
          content:
            (item as any).summary ||
            item.contentSnippet ||
            (item as any).description ||
            '',
          authors,
          source: feed.source,
          categories: item.categories || [],
        };
      });

      allPapers.push(...papers);
      console.log(`Fetched ${papers.length} papers from ${feed.source}`);
    } catch (error) {
      console.error(`Error fetching ${feed.source}:`, error);
    }
  }

  // Sort by publication date (newest first)
  allPapers.sort((a, b) =>
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  return allPapers;
}
