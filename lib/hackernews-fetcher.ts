export interface HackerNewsStory {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  source: string;
  categories?: string[];
  score?: number;
  author?: string;
}

const HACKER_NEWS_API = 'https://hacker-news.firebaseio.com/v0';

// AI-related keywords to search for
const AI_KEYWORDS = [
  'ai',
  'artificial intelligence',
  'machine learning',
  'deep learning',
  'neural network',
  'openai',
  'chatgpt',
  'llm',
  'gpt',
  'gemini',
  'claude',
];

async function fetchStoryDetails(storyId: number): Promise<any> {
  try {
    const response = await fetch(`${HACKER_NEWS_API}/item/${storyId}.json`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error fetching story ${storyId}:`, error);
    return null;
  }
}

function isAIRelated(story: any): boolean {
  if (!story || !story.title) return false;

  const titleLower = story.title.toLowerCase();
  const textLower = (story.text || '').toLowerCase();
  const combined = `${titleLower} ${textLower}`;

  return AI_KEYWORDS.some(keyword => combined.includes(keyword));
}

function convertToStory(story: any): HackerNewsStory {
  // Create link - prefer story URL, fallback to HN discussion
  const link = story.url || `https://news.ycombinator.com/item?id=${story.id}`;

  // Convert Unix timestamp to ISO date
  const pubDate = new Date(story.time * 1000).toISOString();

  // Get content from text field or use title
  const content = story.text || story.title || '';

  return {
    title: story.title || 'No title',
    link,
    pubDate,
    content: content.substring(0, 2000), // Limit content length
    source: 'Hacker News',
    categories: ['Technology', 'AI'],
    score: story.score || 0,
    author: story.by || 'unknown',
  };
}

export async function fetchHackerNewsStories(
  selectedSources?: string[]
): Promise<HackerNewsStory[]> {
  // Check if Hacker News is selected
  if (selectedSources && !selectedSources.includes('hackernews')) {
    return [];
  }

  const allStories: HackerNewsStory[] = [];

  try {
    console.log('Fetching from Hacker News...');

    // Get top stories IDs
    const response = await fetch(`${HACKER_NEWS_API}/topstories.json`);
    const storyIds: number[] = await response.json();

    // Fetch first 100 top stories (to find enough AI-related ones)
    const topStoryIds = storyIds.slice(0, 100);

    console.log(`Checking ${topStoryIds.length} top Hacker News stories for AI content...`);

    // Fetch stories in batches to avoid overwhelming the API
    const batchSize = 10;
    const aiStories: any[] = [];

    for (let i = 0; i < topStoryIds.length && aiStories.length < 50; i += batchSize) {
      const batch = topStoryIds.slice(i, i + batchSize);
      const stories = await Promise.all(batch.map(id => fetchStoryDetails(id)));

      // Filter for AI-related stories
      const relevantStories = stories.filter(story => story && isAIRelated(story));
      aiStories.push(...relevantStories);

      // Small delay between batches
      if (i + batchSize < topStoryIds.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`Found ${aiStories.length} AI-related stories`);

    const posts = aiStories.map(story => convertToStory(story));
    allStories.push(...posts);

    console.log(`Fetched ${posts.length} posts from Hacker News`);
  } catch (error) {
    console.error('Error fetching Hacker News:', error);
  }

  // Sort by score (popularity)
  allStories.sort((a, b) => (b.score || 0) - (a.score || 0));

  console.log(`Returning ${allStories.length} total stories from Hacker News`);
  return allStories;
}
