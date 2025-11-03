import { NextResponse } from 'next/server';
import { getAllDocuments } from '@/lib/pinecone';
import { analyzeData } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Fetching analytics from Pinecone database...');

    // Get all stored documents from Pinecone
    const documents = await getAllDocuments();

    // Convert Pinecone documents to articles and papers format
    const articles: any[] = [];
    const papers: any[] = [];

    documents.forEach((doc: any) => {
      const metadata = doc.metadata;
      if (!metadata) return;

      const item = {
        title: metadata.title || 'No title',
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

    console.log(`Retrieved ${articles.length} articles and ${papers.length} papers from database`);

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
