import { NextResponse } from 'next/server';
import { scrapeRSSFeeds } from '@/lib/rss-scraper';
import { fetchArxivPapers } from '@/lib/arxiv-fetcher';
import { storeDocument } from '@/lib/pinecone';
import { analyzeData } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('Starting data scraping...');

    // Fetch articles and papers
    const [articles, papers] = await Promise.all([
      scrapeRSSFeeds(),
      fetchArxivPapers(),
    ]);

    console.log(`Fetched ${articles.length} articles and ${papers.length} papers`);

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
