import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllDocuments } from '@/lib/pinecone';
import { analyzeData } from '@/lib/analytics';
import { Article } from '@/lib/rss-scraper';
import { ArxivPaper } from '@/lib/arxiv-fetcher';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Generating AI predictions for 2026...');

    // Get all documents from Pinecone
    const documents = await getAllDocuments();

    if (documents.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No data available for predictions',
      });
    }

    // Convert documents to articles and papers
    const articles: Article[] = [];
    const papers: ArxivPaper[] = [];

    documents.forEach((doc: any) => {
      const metadata = doc.metadata;
      const item = {
        title: metadata.title || 'Untitled',
        link: metadata.link || '',
        pubDate: metadata.pubDate || new Date().toISOString(),
        content: metadata.content || '',
        source: metadata.source || 'Unknown',
        categories: metadata.categories || [],
      };

      if (metadata.type === 'paper') {
        papers.push({
          ...item,
          authors: metadata.authors || [],
        });
      } else {
        articles.push(item);
      }
    });

    // Get analytics data
    const analytics = analyzeData(articles, papers);

    // Create a comprehensive summary for AI analysis
    const topKeywords = analytics.topicTrends.slice(0, 10).map(t =>
      `${t.keyword} (${t.count} mentions, ${t.percentage.toFixed(1)}%)`
    ).join(', ');

    const topSources = analytics.sourceBreakdown.slice(0, 5).map(s =>
      `${s.source} (${s.count} items, ${s.percentage.toFixed(1)}%)`
    ).join(', ');

    // Calculate growth trends from timeline
    const recentMonths = analytics.timeline.slice(-6);
    const earlierMonths = analytics.timeline.slice(-12, -6);

    const recentAvg = recentMonths.length > 0
      ? recentMonths.reduce((sum, m) => sum + m.total, 0) / recentMonths.length
      : 0;
    const earlierAvg = earlierMonths.length > 0
      ? earlierMonths.reduce((sum, m) => sum + m.total, 0) / earlierMonths.length
      : 0;

    const growthRate = earlierAvg > 0
      ? ((recentAvg - earlierAvg) / earlierAvg * 100).toFixed(1)
      : '0';

    // Get sample of recent titles for context
    const recentTitles = analytics.recentItems
      .slice(0, 20)
      .map(item => item.title)
      .join('\n- ');

    const prompt = `You are an AI trends analyst. Based on the following data from our AI research and news aggregator, predict content trends for 2026.

**Current Data Summary:**
- Total Articles: ${analytics.totalArticles}
- Total Research Papers: ${analytics.totalPapers}
- Total Social Posts: ${analytics.totalSocialPosts}
- Data Range: ${new Date(analytics.dateRange.earliest).toLocaleDateString()} to ${new Date(analytics.dateRange.latest).toLocaleDateString()}
- Recent Growth Rate: ${growthRate}% (comparing last 6 months to previous 6 months)

**Top 10 Trending Topics:**
${topKeywords}

**Top 5 Data Sources:**
${topSources}

**Recent Article/Paper Titles (sample):**
- ${recentTitles}

**Timeline Trend:**
${analytics.timeline.slice(-6).map(t => `${t.month}: ${t.total} items`).join('\n')}

Based on this data, provide a prediction for AI content trends in 2026. Focus on:
1. Which topics are likely to dominate discussions
2. Expected growth in research areas
3. Emerging themes that are currently gaining momentum
4. Potential shifts in focus from current trends

Keep your response concise (4-6 sentences), insightful, and data-driven. Use a professional but accessible tone.`;

    // Generate prediction with Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const prediction = result.response.text();

    console.log('AI prediction generated successfully');

    return NextResponse.json({
      success: true,
      prediction,
      dataPoints: {
        totalItems: analytics.totalArticles + analytics.totalPapers + analytics.totalSocialPosts,
        growthRate: `${growthRate}%`,
        topKeyword: analytics.topicTrends[0]?.keyword || 'N/A',
        dateRange: analytics.dateRange,
      },
      lastGenerated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating predictions:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
