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

export interface ActiveSource {
  source: string;
  count: number;
  lastPublished: string;
}

export interface AnalyticsData {
  totalArticles: number;
  totalPapers: number;
  totalSocialPosts: number;
  topicTrends: TopicTrend[];
  sourceBreakdown: SourceBreakdown[];
  recentItems: any[];
  timeline: TimelineData[];
  dateRange: {
    earliest: string;
    latest: string;
  };
  mostActiveSourcesWeek: ActiveSource[];
  mostActiveSourcesMonth: ActiveSource[];
}

// Trending AI concepts and buzzwords to track
// Focus on sophisticated, cutting-edge concepts (not mainstream terms)
const TRENDING_AI_KEYWORDS = [
  // Emerging AI Paradigms
  'Agentic AI',
  'Multimodal AI',
  'Multimodal Generative AI',
  'Small Language Model',
  'Small Language Models',
  'SLM',

  // Advanced Capabilities
  'AI Reasoning',
  'Autonomous AI',
  'Explainable AI',
  'XAI',
  'Trusted AI',

  // Cutting-Edge Technical Approaches
  'Retrieval Augmented Generation',
  'RAG',
  'Prompt Engineering',
  'Fine-tuning',
  'Fine Tuning',
  'Transfer Learning',
  'Transformer Architecture',
  'Transformers',
  'Diffusion Model',
  'Diffusion Models',

  // Governance & Ethics (Strategic Focus)
  'AI Governance',
  'AI Ethics',
  'AI Regulation',
  'AI Policy',
  'AI Compliance',
  'Shadow AI',
  'AI Bias',
  'AI Fairness',
  'AI Transparency',
  'Responsible AI',

  // Infrastructure & Performance (Specialized)
  'Custom Silicon',
  'AI Chip',
  'AI Chips',
  'Edge AI',
  'Federated Learning',
  'Neuromorphic Computing',

  // Environmental & Sustainability
  'Environmental Footprint of AI',
  'AI Sustainability',
  'Green AI',
  'AI Carbon Footprint',
  'Energy Efficient AI',
  'Sustainable AI',

  // Specific Model Architectures
  'GPT-4',
  'GPT-5',
  'Llama 3',
  'Mistral',
  'DALL-E',
  'Stable Diffusion',
  'Midjourney',

  // Advanced Techniques & Methods
  'Zero-shot Learning',
  'Few-shot Learning',
  'Chain of Thought',
  'In-context Learning',
  'Model Pruning',
  'Quantization',
  'Knowledge Distillation',

  // Specialized Applications
  'Computer Vision',
  'Multimodal Learning',
  'Speech Synthesis',
  'Image Generation',
  'Text-to-Image',
  'Text-to-Video',
  'Code Generation',
  'Video Generation',

  // Strategic Business Concepts
  'AI Adoption',
  'AI Integration',
  'AI ROI',
  'AI Strategy',
  'AI Transformation',
  'Enterprise AI',
  'AI Platform',
  'AI-First',

  // Research & Innovation
  'AI Innovation',
  'AI Breakthrough',
  'Frontier Model',
  'Foundation Model',
  'Mixture of Experts',
  'MoE',

  // Safety & Security
  'AI Safety',
  'AI Security',
  'AI Alignment',
  'AI Risk',
  'Adversarial AI',
  'AI Red Teaming',
  'AI Hallucination',

  // Advanced Data Concepts
  'Synthetic Data',
  'Data Augmentation',
  'Vector Database',
  'Vector Embeddings',
  'Embedding',
  'Semantic Search',
];

// Normalize keywords for matching (lowercase, no special chars)
const NORMALIZED_KEYWORDS = new Map(
  TRENDING_AI_KEYWORDS.map(keyword => [
    keyword.toLowerCase().replace(/[^a-z0-9\s]/g, ''),
    keyword
  ])
);

function extractKeywords(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found: string[] = [];

  // Check for each trending keyword
  for (const [normalized, original] of NORMALIZED_KEYWORDS.entries()) {
    // Create a regex that matches the keyword as a whole phrase
    const regex = new RegExp(`\\b${normalized.replace(/\s+/g, '\\s+')}\\b`, 'gi');

    if (regex.test(lowerText)) {
      found.push(original);
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

  // Keywords are already properly capitalized from TRENDING_AI_KEYWORDS
  // No need for additional capitalization
  const capitalizePhrase = (phrase: string): string => {
    return phrase; // Return as-is since keywords are pre-formatted
  };

  // Calculate topic trends
  const totalItems = allItems.length;
  const topicTrends: TopicTrend[] = Array.from(keywordCounts.entries())
    .filter(([_, count]) => count >= 3) // Only show phrases that appear at least 3 times
    .map(([keyword, count]) => ({
      keyword: capitalizePhrase(keyword),
      count,
      percentage: (count / totalItems) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15); // Top 15 keywords

  // Calculate source breakdown
  const sourceCounts = new Map<string, number>();

  allItems.forEach((item) => {
    // Group sources for cleaner pie chart
    let source = item.source;
    if (source.startsWith('News API -')) {
      source = 'News API';
    } else if (source.startsWith('Semantic Scholar -')) {
      source = 'Semantic Scholar';
    } else if (source.startsWith('ArXiv -')) {
      source = 'ArXiv';
    } else if (source.startsWith('Reddit -')) {
      source = 'Reddit';
    } else if (source === 'Hacker News') {
      source = 'Hacker News';
    }
    sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
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

  // Calculate timeline distribution for 2025 by month
  const monthCounts2025 = new Map<string, { articles: number; papers: number }>();
  let earliestDate = new Date();
  let latestDate = new Date(0);

  allItems.forEach((item) => {
    const date = new Date(item.pubDate);
    if (date < earliestDate) earliestDate = date;
    if (date > latestDate) latestDate = date;

    // Only include 2025 data
    if (date.getFullYear() === 2025) {
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const counts = monthCounts2025.get(monthKey) || { articles: 0, papers: 0 };

      if (item.type === 'article') {
        counts.articles++;
      } else {
        counts.papers++;
      }

      monthCounts2025.set(monthKey, counts);
    }
  });

  // Convert to sorted array with month names
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const timeline: TimelineData[] = Array.from(monthCounts2025.entries())
    .map(([monthKey, counts]) => {
      const monthIndex = parseInt(monthKey.split('-')[1]) - 1;
      return {
        month: monthNames[monthIndex],
        articles: counts.articles,
        papers: counts.papers,
        total: counts.articles + counts.papers,
      };
    })
    .sort((a, b) => {
      const aIndex = monthNames.indexOf(a.month);
      const bIndex = monthNames.indexOf(b.month);
      return aIndex - bIndex;
    });

  // Calculate total social posts (Reddit + Hacker News)
  const totalSocialPosts = allItems.filter(
    (item) => item.source.startsWith('Reddit -') || item.source === 'Hacker News'
  ).length;

  // Calculate most active sources (last week and last month)
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const weekItems = allItems.filter(item => new Date(item.pubDate) >= oneWeekAgo);
  const monthItems = allItems.filter(item => new Date(item.pubDate) >= oneMonthAgo);

  const calculateActiveSource = (items: any[]): ActiveSource[] => {
    const sourceMap = new Map<string, { count: number; lastPublished: Date }>();

    items.forEach(item => {
      const pubDate = new Date(item.pubDate);
      const existing = sourceMap.get(item.source);

      if (!existing || pubDate > existing.lastPublished) {
        sourceMap.set(item.source, {
          count: (existing?.count || 0) + 1,
          lastPublished: pubDate,
        });
      } else {
        sourceMap.set(item.source, {
          count: existing.count + 1,
          lastPublished: existing.lastPublished,
        });
      }
    });

    return Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        count: data.count,
        lastPublished: data.lastPublished.toISOString(),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 sources
  };

  const mostActiveSourcesWeek = calculateActiveSource(weekItems);
  const mostActiveSourcesMonth = calculateActiveSource(monthItems);

  return {
    totalArticles: articles.length,
    totalPapers: papers.length,
    totalSocialPosts,
    topicTrends,
    sourceBreakdown,
    recentItems,
    timeline,
    dateRange: {
      earliest: earliestDate.toISOString(),
      latest: latestDate.toISOString(),
    },
    mostActiveSourcesWeek,
    mostActiveSourcesMonth,
  };
}
