import { Article } from './rss-scraper';
import { ArxivPaper } from './arxiv-fetcher';

export interface TopicTrend {
  keyword: string;
  count: number;
  percentage: number;
}

export interface SourceBreakdown {
  source: string;
  count: number;
  percentage: number;
}

export interface TimelineData {
  month: string;
  articles: number;
  papers: number;
  total: number;
}

export interface AnalyticsData {
  totalArticles: number;
  totalPapers: number;
  topicTrends: TopicTrend[];
  sourceBreakdown: SourceBreakdown[];
  recentItems: any[];
  timeline: TimelineData[];
  dateRange: {
    earliest: string;
    latest: string;
  };
}

// Common AI/ML keywords to track
const AI_KEYWORDS = [
  'GPT',
  'LLM',
  'Large Language Model',
  'ChatGPT',
  'Gemini',
  'Claude',
  'OpenAI',
  'Anthropic',
  'Deep Learning',
  'Neural Network',
  'Machine Learning',
  'Computer Vision',
  'Natural Language Processing',
  'NLP',
  'Transformer',
  'Diffusion',
  'Stable Diffusion',
  'DALL-E',
  'Generative AI',
  'AI Agent',
  'Reinforcement Learning',
  'Multimodal',
  'RAG',
  'Vector Database',
  'Fine-tuning',
  'Prompt Engineering',
];

function extractKeywords(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found: string[] = [];

  for (const keyword of AI_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      found.push(keyword);
    }
  }

  return found;
}

export function analyzeData(
  articles: Article[],
  papers: ArxivPaper[]
): AnalyticsData {
  const allItems = [
    ...articles.map((a) => ({ ...a, type: 'article' as const })),
    ...papers.map((p) => ({ ...p, type: 'paper' as const })),
  ];

  // Extract keywords from all content
  const keywordCounts = new Map<string, number>();

  allItems.forEach((item) => {
    const text = `${item.title} ${item.content}`;
    const keywords = extractKeywords(text);

    keywords.forEach((keyword) => {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    });
  });

  // Calculate topic trends
  const totalItems = allItems.length;
  const topicTrends: TopicTrend[] = Array.from(keywordCounts.entries())
    .map(([keyword, count]) => ({
      keyword,
      count,
      percentage: (count / totalItems) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15); // Top 15 keywords

  // Calculate source breakdown
  const sourceCounts = new Map<string, number>();

  allItems.forEach((item) => {
    sourceCounts.set(item.source, (sourceCounts.get(item.source) || 0) + 1);
  });

  const sourceBreakdown: SourceBreakdown[] = Array.from(
    sourceCounts.entries()
  )
    .map(([source, count]) => ({
      source,
      count,
      percentage: (count / totalItems) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  // Get recent items (last 20)
  const recentItems = allItems
    .sort(
      (a, b) =>
        new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    )
    .slice(0, 20);

  // Calculate timeline distribution by month
  const monthCounts = new Map<string, { articles: number; papers: number }>();
  let earliestDate = new Date();
  let latestDate = new Date(0);

  allItems.forEach((item) => {
    const date = new Date(item.pubDate);
    if (date < earliestDate) earliestDate = date;
    if (date > latestDate) latestDate = date;

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const counts = monthCounts.get(monthKey) || { articles: 0, papers: 0 };

    if (item.type === 'article') {
      counts.articles++;
    } else {
      counts.papers++;
    }

    monthCounts.set(monthKey, counts);
  });

  // Convert to sorted array
  const timeline: TimelineData[] = Array.from(monthCounts.entries())
    .map(([month, counts]) => ({
      month,
      articles: counts.articles,
      papers: counts.papers,
      total: counts.articles + counts.papers,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalArticles: articles.length,
    totalPapers: papers.length,
    topicTrends,
    sourceBreakdown,
    recentItems,
    timeline,
    dateRange: {
      earliest: earliestDate.toISOString(),
      latest: latestDate.toISOString(),
    },
  };
}
