import { NextResponse } from 'next/server';
import { scrapeRSSFeeds } from '@/lib/rss-scraper';
import { fetchArxivPapers } from '@/lib/arxiv-fetcher';
import { analyzeData } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Fetching data for analytics...');

    // Fetch fresh data (cached for development)
    const [articles, papers] = await Promise.all([
      scrapeRSSFeeds(),
      fetchArxivPapers(),
    ]);

    // Analyze data
    const analytics = analyzeData(articles, papers);

    return NextResponse.json({
      success: true,
      data: analytics,
      lastRefresh: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in analytics API:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
