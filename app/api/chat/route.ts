import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { queryDocuments } from '@/lib/pinecone';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('User message:', message);

    // Query Pinecone for relevant documents
    const relevantDocs = await queryDocuments(message, 5);

    // Build context from relevant documents
    const context = relevantDocs
      .map((doc, idx) => {
        const metadata = doc.metadata as any;
        return `
Document ${idx + 1}:
Title: ${metadata.title}
Source: ${metadata.source}
Date: ${metadata.pubDate}
Content: ${metadata.content.substring(0, 500)}...
`;
      })
      .join('\n\n');

    // Create prompt with context
    const prompt = `You are an AI assistant helping users understand the latest AI news and research. Use the following context from recent articles and papers to answer the user's question. If the context doesn't contain relevant information, say so and provide a general answer based on your knowledge.

Context:
${context}

User Question: ${message}

Answer:`;

    // Generate response with Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    console.log('AI response generated');

    return NextResponse.json({
      success: true,
      response,
      sourcesUsed: relevantDocs.length,
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
