export interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  source: string;
  categories?: string[];
}

// News API configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2/everything';

export async function fetchNewsAPIArticles(selectedSources?: string[]): Promise<NewsArticle[]> {
  // Check if News API is configured
  if (!NEWS_API_KEY || !selectedSources?.includes('newsapi')) {
    return [];
  }

  const allArticles: NewsArticle[] = [];

  try {
    console.log('Fetching from News API...');

    // Build query for AI-related news
    const query = 'artificial intelligence OR machine learning OR AI OR deep learning';
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 7); // Last 7 days

    const params = new URLSearchParams({
      q: query,
      from: fromDate.toISOString().split('T')[0],
      sortBy: 'publishedAt',
      language: 'en',
      pageSize: '100', // Max allowed
      apiKey: NEWS_API_KEY,
    });

    const response = await fetch(`${NEWS_API_URL}?${params}`);
    const data = await response.json();

    if (data.status === 'ok' && data.articles) {
      const articles = data.articles.map((article: any) => ({
        title: article.title || 'No title',
        link: article.url || '',
        pubDate: article.publishedAt || new Date().toISOString(),
        content: article.description || article.content || '',
        source: `News API - ${article.source?.name || 'Unknown'}`,
        categories: ['AI News'],
      }));

      allArticles.push(...articles);
      console.log(`Fetched ${articles.length} articles from News API`);
    } else {
      console.log('News API returned no results or error:', data.message);
    }
  } catch (error) {
    console.error('Error fetching from News API:', error);
  }

  return allArticles;
}
