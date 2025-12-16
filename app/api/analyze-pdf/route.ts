import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'No text provided' },
        { status: 400 }
      );
    }

    console.log('Analyzing PDF content with Gemini AI...');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const dcaiPriorities = `
DCAI (Dubai Centre for Artificial Intelligence) Core Strategic Priorities:

1. Government Service Transformation Metrics
   - AI Adoption Across 30+ Government Entities
   - Service Processing Time Reduction (days to minutes)
   - Chatbot Performance (60-80% of routine inquiries)
   - 75+ pilot projects across 33 entities
   - 1,000 government employees trained on generative AI

2. Talent Development & Economic Impact
   - Training 1 million AI talents by 2027
   - AI's GDP Contribution: 9% → 45% by 2031 (AED 335B value)
   - Startup Ecosystem Growth (615 companies at AI Campus)
   - Job Creation in AI Sector

3. Innovation & Pilot Success Stories
   - Efficiency Gains: Lost items recovery 300%, Smart waste 80%
   - Paper Elimination: 1.3B+ sheets saved, 100% paperless goal
   - Healthcare AI Impact, Transport Safety improvements

4. Strategic Alignment
   - UAE AI Strategy 2031 (Transport, Health, Space, Energy, Education)
   - Dubai Economic Agenda D33: AED 100B annual contribution
   - Global partnerships (Microsoft, IBM, Oracle)

5. Real-Time Service Excellence
   - Happiness Index as primary goal
   - Service Response Times improvement
   - Accessibility & Citizen Engagement
`;

    const prompt = `You are an expert data analyst specializing in AI strategy and governance. Analyze the following PDF content and extract key insights in a structured format.

Extract and provide the following information in valid JSON format:

1. **title**: A clear, descriptive title for this document/report
2. **summary**: A concise 2-3 sentence summary of the document
3. **keyMetrics**: An array of 4-8 important metrics/numbers found in the document. Each metric should have:
   - label: The metric name
   - value: The numeric value or key finding
   - unit: The unit of measurement (if applicable)
4. **insights**: An array of 3-5 key insights or findings from the document
5. **categories**: An array of 2-4 main topics/categories this document covers
6. **dataPoints**: If the document contains numerical data, extract up to 10 data points with:
   - category: The category or label
   - value: The numeric value
7. **recommendations**: An array of 2-4 actionable recommendations or next steps mentioned in the document
8. **sentiment**: Overall sentiment of the document (positive, neutral, negative, mixed)

9. **dcaiAlignment**: Analyze how this document aligns with DCAI priorities. Provide:
   - alignmentScore: A number from 0-100 representing overall alignment with DCAI priorities
   - strengths: Array of 2-4 areas where the report strongly aligns with DCAI priorities (reference specific DCAI goals)
   - gaps: Array of 2-4 areas where the report diverges from or misses DCAI priorities
   - alternativePerspectives: Array of 2-4 alternative ways to view metrics/findings from a DCAI lens. For example, if report says "59% AI adoption in UAE", provide DCAI perspective like "While 59% adoption is significant, DCAI's focus is on depth of transformation (days-to-minutes service improvements) rather than just adoption percentages"
   - strategicRecommendations: Array of 2-3 recommendations on how to better align with DCAI ideology

DCAI Priorities Context:
${dcaiPriorities}

PDF Content:
${text.substring(0, 30000)}

Respond ONLY with a valid JSON object. Do not include any markdown formatting or code blocks.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let analysisText = response.text();

    // Remove markdown code blocks if present
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    console.log('Raw AI response:', analysisText);

    let analysis;
    try {
      analysis = JSON.parse(analysisText);

      // If dcaiAlignment is missing, generate it in a separate call
      if (!analysis.dcaiAlignment) {
        console.log('DCAI alignment missing, generating separately...');

        const dcaiPrompt = `You are an expert in AI strategy and governance for Dubai. Analyze how the following report aligns with DCAI (Dubai Centre for Artificial Intelligence) priorities.

DCAI Priorities:
${dcaiPriorities}

Report Summary:
Title: ${analysis.title}
Summary: ${analysis.summary}
Key Metrics: ${JSON.stringify(analysis.keyMetrics)}
Insights: ${JSON.stringify(analysis.insights)}

Provide ONLY a valid JSON object with these fields:
{
  "alignmentScore": (number 0-100),
  "strengths": [array of 2-4 alignment strengths],
  "gaps": [array of 2-4 gaps or divergences],
  "alternativePerspectives": [array of 2-4 alternative DCAI perspectives on the metrics/findings],
  "strategicRecommendations": [array of 2-3 recommendations for better DCAI alignment]
}`;

        const dcaiResult = await model.generateContent(dcaiPrompt);
        const dcaiResponse = await dcaiResult.response;
        let dcaiText = dcaiResponse.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        try {
          analysis.dcaiAlignment = JSON.parse(dcaiText);
          console.log('DCAI alignment generated successfully');
        } catch (dcaiError) {
          console.error('Failed to parse DCAI alignment:', dcaiError);
          // Provide a default alignment
          analysis.dcaiAlignment = {
            alignmentScore: 50,
            strengths: ['Report discusses AI applications relevant to government services'],
            gaps: ['Missing specific DCAI metrics and KPIs'],
            alternativePerspectives: ['The report could benefit from focusing on measurable outcomes like service processing time reductions'],
            strategicRecommendations: ['Align metrics with DCAI\'s specific goals for government transformation']
          };
        }
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Attempted to parse:', analysisText);

      // Fallback response
      analysis = {
        title: 'PDF Analysis',
        summary: 'Unable to parse AI response. Please try again.',
        keyMetrics: [],
        insights: ['Analysis failed - please try uploading again'],
        categories: ['Unknown'],
        dataPoints: [],
        recommendations: [],
        sentiment: 'neutral',
        dcaiAlignment: {
          alignmentScore: 0,
          strengths: [],
          gaps: ['Analysis failed'],
          alternativePerspectives: [],
          strategicRecommendations: ['Please try uploading the PDF again']
        }
      };
    }

    console.log('PDF analysis completed successfully');

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Error analyzing PDF:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
