export interface SemanticScholarPaper {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  authors: string[];
  source: string;
  categories?: string[];
  citationCount?: number;
}

// Semantic Scholar API configuration
const SEMANTIC_SCHOLAR_API = 'https://api.semanticscholar.org/graph/v1/paper/search';

// Search queries for different AI/ML topics
const SEARCH_QUERIES = [
  {
    id: 'semantic-scholar-ai',
    query: 'artificial intelligence',
    source: 'Semantic Scholar - AI',
    fields: 'AI,Machine Learning',
  },
  {
    id: 'semantic-scholar-ml',
    query: 'machine learning',
    source: 'Semantic Scholar - ML',
    fields: 'Machine Learning',
  },
  {
    id: 'semantic-scholar-nlp',
    query: 'natural language processing',
    source: 'Semantic Scholar - NLP',
    fields: 'NLP,Computational Linguistics',
  },
  {
    id: 'semantic-scholar-cv',
    query: 'computer vision',
    source: 'Semantic Scholar - CV',
    fields: 'Computer Vision',
  },
  {
    id: 'semantic-scholar-dl',
    query: 'deep learning',
    source: 'Semantic Scholar - Deep Learning',
    fields: 'Deep Learning,Neural Networks',
  },
];

async function searchPapers(query: string, limit: number = 50): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
      fields: 'title,abstract,authors,year,citationCount,publicationDate,url,externalIds',
      sort: 'publicationDate:desc',
    });

    const response = await fetch(`${SEMANTIC_SCHOLAR_API}?${params}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(`Error searching Semantic Scholar for "${query}":`, error);
    return [];
  }
}

function convertToPaper(result: any, source: string, fields: string): SemanticScholarPaper {
  // Extract authors
  const authors = result.authors?.map((a: any) => a.name) || [];

  // Create link - prefer DOI, then ArXiv, then Semantic Scholar URL
  let link = result.url || '';
  if (result.externalIds) {
    if (result.externalIds.DOI) {
      link = `https://doi.org/${result.externalIds.DOI}`;
    } else if (result.externalIds.ArXiv) {
      link = `https://arxiv.org/abs/${result.externalIds.ArXiv}`;
    }
  }

  // Use publication date or year
  const pubDate = result.publicationDate ||
    (result.year ? `${result.year}-01-01` : new Date().toISOString());

  return {
    title: result.title || 'No title',
    link,
    pubDate,
    content: result.abstract || '',
    authors,
    source,
    categories: fields.split(','),
    citationCount: result.citationCount || 0,
  };
}

export async function fetchSemanticScholarPapers(
  selectedSources?: string[]
): Promise<SemanticScholarPaper[]> {
  const allPapers: SemanticScholarPaper[] = [];

  // Filter queries based on selected sources
  const queriesToFetch = selectedSources && selectedSources.length > 0
    ? SEARCH_QUERIES.filter(q => selectedSources.includes(q.id))
    : SEARCH_QUERIES;

  for (const queryConfig of queriesToFetch) {
    try {
      console.log(`Fetching from ${queryConfig.source}...`);

      const results = await searchPapers(queryConfig.query, 50);

      const papers = results.map(result =>
        convertToPaper(result, queryConfig.source, queryConfig.fields)
      );

      allPapers.push(...papers);
      console.log(`Fetched ${papers.length} papers from ${queryConfig.source}`);

      // Add delay to respect rate limits (100 requests per 5 minutes)
      // Reduced to 1 second for faster scraping
      if (queriesToFetch.length > 1 && queriesToFetch.indexOf(queryConfig) < queriesToFetch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error fetching ${queryConfig.source}:`, error);
    }
  }

  // Sort by publication date (newest first)
  allPapers.sort((a, b) =>
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  console.log(`Returning ${allPapers.length} total papers from Semantic Scholar`);
  return allPapers;
}
