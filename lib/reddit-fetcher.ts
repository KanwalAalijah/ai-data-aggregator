export interface RedditPost {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  source: string;
  categories?: string[];
  score?: number;
  author?: string;
}

// AI-related subreddits
const SUBREDDITS = [
  {
    id: 'reddit-machinelearning',
    subreddit: 'MachineLearning',
    source: 'Reddit - r/MachineLearning',
  },
  {
    id: 'reddit-artificial',
    subreddit: 'artificial',
    source: 'Reddit - r/artificial',
  },
  {
    id: 'reddit-deeplearning',
    subreddit: 'deeplearning',
    source: 'Reddit - r/deeplearning',
  },
  {
    id: 'reddit-datascience',
    subreddit: 'datascience',
    source: 'Reddit - r/datascience',
  },
  {
    id: 'reddit-learnmachinelearning',
    subreddit: 'learnmachinelearning',
    source: 'Reddit - r/learnmachinelearning',
  },
];

async function fetchSubredditPosts(subreddit: string, limit: number = 50): Promise<any[]> {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AI-Data-Aggregator/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.children || [];
  } catch (error) {
    console.error(`Error fetching r/${subreddit}:`, error);
    return [];
  }
}

function convertToPost(child: any, source: string): RedditPost {
  const post = child.data;

  // Get post content - prefer selftext, fallback to title
  const content = post.selftext || post.title || '';

  // Create Reddit link
  const link = `https://www.reddit.com${post.permalink}`;

  // Convert Unix timestamp to ISO date
  const pubDate = new Date(post.created_utc * 1000).toISOString();

  return {
    title: post.title || 'No title',
    link,
    pubDate,
    content: content.substring(0, 2000), // Limit content length
    source,
    categories: [post.subreddit],
    score: post.score || 0,
    author: post.author || 'unknown',
  };
}

export async function fetchRedditPosts(
  selectedSources?: string[]
): Promise<RedditPost[]> {
  const allPosts: RedditPost[] = [];

  // Filter subreddits based on selected sources
  const subredditsToFetch = selectedSources && selectedSources.length > 0
    ? SUBREDDITS.filter(sub => selectedSources.includes(sub.id))
    : SUBREDDITS;

  for (const subConfig of subredditsToFetch) {
    try {
      console.log(`Fetching from ${subConfig.source}...`);

      const children = await fetchSubredditPosts(subConfig.subreddit, 50);

      const posts = children.map(child =>
        convertToPost(child, subConfig.source)
      );

      allPosts.push(...posts);
      console.log(`Fetched ${posts.length} posts from ${subConfig.source}`);

      // Add delay to respect rate limits (60 requests per minute = 1 per second)
      if (subredditsToFetch.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error fetching ${subConfig.source}:`, error);
    }
  }

  // Sort by score (upvotes) and date
  allPosts.sort((a, b) => {
    // First by score
    const scoreDiff = (b.score || 0) - (a.score || 0);
    if (scoreDiff !== 0) return scoreDiff;
    // Then by date
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
  });

  console.log(`Returning ${allPosts.length} total posts from Reddit`);
  return allPosts;
}
