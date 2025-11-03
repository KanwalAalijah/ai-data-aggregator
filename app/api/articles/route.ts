import { NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone';

export async function GET() {
  try {
    const pc = getPineconeClient();
    const indexName = process.env.PINECONE_INDEX_NAME || 'ai-data-aggregator';
    const index = pc.index(indexName);

    // Query with a dummy vector to get all records
    // We'll use a zero vector and set topK high to get many results
    const dimension = 768;
    const queryVector = new Array(dimension).fill(0);

    const queryResponse = await index.query({
      vector: queryVector,
      topK: 10000, // Get up to 10000 records
      includeMetadata: true,
    });

    // Extract articles from the matches
    const articles = queryResponse.matches
      ?.map((match: any) => ({
        id: match.id,
        title: match.metadata?.title || 'No title',
        source: match.metadata?.source || 'Unknown',
        date: match.metadata?.date || match.metadata?.pubDate || new Date().toISOString(),
        link: match.metadata?.link || match.metadata?.url || '#',
        content: match.metadata?.content || match.metadata?.text || '',
        authors: match.metadata?.authors || [],
        categories: match.metadata?.categories || [],
      }))
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

    return NextResponse.json({
      success: true,
      articles,
      total: articles.length,
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
