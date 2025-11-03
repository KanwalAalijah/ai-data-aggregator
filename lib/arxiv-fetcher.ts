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
    id: 'arxiv-ai',
    url: 'http://export.arxiv.org/rss/cs.AI',
    source: 'ArXiv - AI',
  },
  {
    id: 'arxiv-ml',
    url: 'http://export.arxiv.org/rss/cs.LG',
    source: 'ArXiv - Machine Learning',
  },
  {
    id: 'arxiv-cl',
    url: 'http://export.arxiv.org/rss/cs.CL',
    source: 'ArXiv - Computation and Language',
  },
  {
    id: 'arxiv-cv',
    url: 'http://export.arxiv.org/rss/cs.CV',
    source: 'ArXiv - Computer Vision',
  },
];

export async function fetchArxivPapers(selectedSources?: string[]): Promise<ArxivPaper[]> {
  const allPapers: ArxivPaper[] = [];

  // Filter feeds based on selected sources
  const feedsToFetch = selectedSources && selectedSources.length > 0
    ? ARXIV_FEEDS.filter(feed => selectedSources.includes(feed.id))
    : ARXIV_FEEDS;

  for (const feed of feedsToFetch) {
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

  console.log(`Returning ${allPapers.length} total papers from ArXiv`);
  return allPapers;
}
