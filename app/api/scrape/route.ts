import { NextRequest, NextResponse } from 'next/server';
import { scrapeRSSFeeds } from '@/lib/rss-scraper';
import { fetchArxivPapers } from '@/lib/arxiv-fetcher';
import { scrapeWebPages } from '@/lib/web-scraper';
import { fetchNewsAPIArticles } from '@/lib/news-api-fetcher';
import { fetchSemanticScholarPapers } from '@/lib/semantic-scholar-fetcher';
import { fetchRedditPosts } from '@/lib/reddit-fetcher';
import { fetchHackerNewsStories } from '@/lib/hackernews-fetcher';
import { storeDocument } from '@/lib/pinecone';
import { analyzeData } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const selectedSources = body.sources || [];

    console.log('Starting data scraping...');
    console.log('Selected sources:', selectedSources);

    // Fetch from all sources
    const [rssArticles, arxivPapers, webDocuments, newsAPIArticles, semanticScholarPapers, redditPosts, hackerNewsStories] = await Promise.all([
      scrapeRSSFeeds(selectedSources),
      fetchArxivPapers(selectedSources),
      scrapeWebPages(selectedSources),
      fetchNewsAPIArticles(selectedSources),
      fetchSemanticScholarPapers(selectedSources),
      fetchRedditPosts(selectedSources),
      fetchHackerNewsStories(selectedSources),
    ]);

    // Combine all articles and papers
    const articles = [...rssArticles, ...webDocuments, ...newsAPIArticles, ...redditPosts, ...hackerNewsStories];
    const papers = [...arxivPapers, ...semanticScholarPapers];

    console.log(`Fetched ${rssArticles.length} RSS articles, ${arxivPapers.length} ArXiv papers, ${semanticScholarPapers.length} Semantic Scholar papers, ${webDocuments.length} web documents, ${newsAPIArticles.length} News API articles, ${redditPosts.length} Reddit posts, ${hackerNewsStories.length} Hacker News stories`);

    // Store in Pinecone
    let storedCount = 0;

    // Store articles
    for (const article of articles) {
      try {
        const id = `article-${Buffer.from(article.link).toString('base64').substring(0, 50)}`;
        const text = `${article.title}\n\n${article.content}`;

        await storeDocument(id, text, {
          title: article.title,
          link: article.link,
          pubDate: article.pubDate,
          source: article.source,
          type: 'article',
          content: article.content,
          categories: article.categories,
        });

        storedCount++;
      } catch (error) {
        console.error(`Error storing article: ${article.title}`, error);
      }
    }

    // Store papers
    for (const paper of papers) {
      try {
        const id = `paper-${Buffer.from(paper.link).toString('base64').substring(0, 50)}`;
        const text = `${paper.title}\n\n${paper.content}`;

        await storeDocument(id, text, {
          title: paper.title,
          link: paper.link,
          pubDate: paper.pubDate,
          source: paper.source,
          type: 'paper',
          content: paper.content,
          authors: paper.authors,
          categories: paper.categories,
        });

        storedCount++;
      } catch (error) {
        console.error(`Error storing paper: ${paper.title}`, error);
      }
    }

    // Analyze data
    const analytics = analyzeData(articles, papers);

    return NextResponse.json({
      success: true,
      message: `Scraped and stored ${storedCount} items`,
      data: {
        articlesCount: articles.length,
        papersCount: papers.length,
        storedCount,
        analytics,
      },
    });
  } catch (error) {
    console.error('Error in scrape API:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to trigger scraping',
  });
}
