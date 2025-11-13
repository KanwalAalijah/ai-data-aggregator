import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Pinecone
let pineconeClient: Pinecone | null = null;

export function getPineconeClient() {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pineconeClient;
}

// Initialize Gemini for embeddings
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Truncate text to avoid exceeding the 36000 byte limit
    // Safe limit: ~8000 characters (well below 36000 bytes)
    const truncatedText = text.length > 8000 ? text.substring(0, 8000) : text;

    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(truncatedText);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

export interface DocumentMetadata {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  type: 'article' | 'paper';
  content: string;
  authors?: string[];
  categories?: string[];
}

export async function storeDocument(
  id: string,
  text: string,
  metadata: DocumentMetadata
) {
  try {
    const pc = getPineconeClient();
    const indexName = process.env.PINECONE_INDEX_NAME || 'ai-data-aggregator';

    // Check if index exists, if not provide instructions
    const indexes = await pc.listIndexes();
    const indexExists = indexes.indexes?.some((idx) => idx.name === indexName);

    if (!indexExists) {
      console.log(`Index "${indexName}" does not exist. Please create it first.`);
      console.log(`You can create it with dimension 768 (for text-embedding-004)`);
      throw new Error(`Pinecone index "${indexName}" not found`);
    }

    const index = pc.index(indexName);

    // Generate embedding
    const embedding = await generateEmbedding(text);

    // Store in Pinecone
    await index.upsert([
      {
        id,
        values: embedding,
        metadata: metadata as any,
      },
    ]);

    console.log(`Stored document ${id} in Pinecone`);
  } catch (error) {
    console.error('Error storing document:', error);
    throw error;
  }
}

export async function queryDocuments(
  query: string,
  topK: number = 5
): Promise<any[]> {
  try {
    const pc = getPineconeClient();
    const indexName = process.env.PINECONE_INDEX_NAME || 'ai-data-aggregator';
    const index = pc.index(indexName);

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Query Pinecone
    const results = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    return results.matches || [];
  } catch (error) {
    console.error('Error querying documents:', error);
    throw error;
  }
}

export async function getAllDocuments(): Promise<any[]> {
  try {
    const pc = getPineconeClient();
    const indexName = process.env.PINECONE_INDEX_NAME || 'ai-data-aggregator';
    const index = pc.index(indexName);

    // Query with a zero vector to get all records
    // This is a workaround since Pinecone doesn't have a "get all" method
    const dimension = 768;
    const zeroVector = new Array(dimension).fill(0);

    const results = await index.query({
      vector: zeroVector,
      topK: 10000, // Get up to 10000 records
      includeMetadata: true,
    });

    console.log(`Retrieved ${results.matches?.length || 0} documents from Pinecone`);

    return results.matches || [];
  } catch (error) {
    console.error('Error getting documents:', error);
    throw error;
  }
}

export async function documentExists(id: string): Promise<boolean> {
  try {
    const pc = getPineconeClient();
    const indexName = process.env.PINECONE_INDEX_NAME || 'ai-data-aggregator';
    const index = pc.index(indexName);

    // Fetch the document by ID
    const result = await index.fetch([id]);
    return result.records && Object.keys(result.records).length > 0;
  } catch (error) {
    console.error('Error checking if document exists:', error);
    return false; // Assume it doesn't exist if there's an error
  }
}
