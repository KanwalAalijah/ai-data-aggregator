import { NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      PINECONE_API_KEY: !!process.env.PINECONE_API_KEY,
      PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'NOT SET',
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      NEWS_API_KEY: !!process.env.NEWS_API_KEY,
    };

    // Try to connect to Pinecone
    const pc = getPineconeClient();
    const indexName = process.env.PINECONE_INDEX_NAME || 'ai-data-aggregator';

    // Check if index exists
    const indexes = await pc.listIndexes();
    const indexExists = indexes.indexes?.some((idx) => idx.name === indexName);

    if (!indexExists) {
      return NextResponse.json({
        success: false,
        error: `Pinecone index "${indexName}" does not exist`,
        envCheck,
        availableIndexes: indexes.indexes?.map(idx => idx.name) || [],
      });
    }

    // Try to get index stats
    const index = pc.index(indexName);
    const stats = await index.describeIndexStats();

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      envCheck,
      indexName,
      stats: {
        totalVectorCount: stats.totalRecordCount || 0,
        dimension: stats.dimension || 0,
        namespaces: stats.namespaces || {},
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      message: 'Failed to connect to database',
    }, { status: 500 });
  }
}
