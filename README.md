# AI Knowledge Base

A comprehensive knowledge aggregation platform that consolidates AI research papers and news articles from multiple sources, featuring interactive visualizations and an AI-powered chatbot using RAG (Retrieval Augmented Generation).

![Dashboard Preview](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4.x-38bdf8?style=flat-square&logo=tailwind-css)

## ✨ Features

### 📊 Real-Time Analytics
- **Live Data Aggregation**: Automatically scrapes and analyzes AI content from:
  - TechCrunch AI
  - VentureBeat AI
  - MIT Technology Review
  - NVIDIA Blog
  - OpenAI Blog
  - ArXiv (AI, ML, Computer Vision, NLP categories)

- **Interactive Visualizations**:
  - Line charts showing publication trends over time
  - Donut charts for source distribution
  - Dynamic keyword trending analysis
  - Real-time statistics cards

### 🤖 AI-Powered Chat Assistant
- RAG-powered chatbot using Google Gemini AI
- Semantic search with Pinecone vector database
- Context-aware responses based on scraped data
- Natural language queries about research trends

### 🎨 Modern UI/UX
- Dark theme design
- Responsive layout (mobile, tablet, desktop)
- Interactive charts using Chart.js
- Smooth animations and transitions
- Real-time data updates

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Pinecone Account** - [Sign up for free](https://www.pinecone.io/)
3. **Google AI Studio Account** - [Get API key](https://makersuite.google.com/app/apikey)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd ai-knowledge-base
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=ai-data-aggregator

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
```

4. **Create Pinecone Index**

Go to your Pinecone dashboard and create a new index:
- **Name**: `ai-data-aggregator`
- **Dimension**: `768` (for text-embedding-004)
- **Metric**: `cosine`

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Scraping Data

Click the **"Scrape Data"** button in the navigation bar to fetch the latest AI articles and research papers. The system will:
1. Fetch content from all configured sources
2. Generate embeddings using Google's text-embedding model
3. Store vectors in Pinecone for semantic search
4. Update all visualizations with new data

### Using the Chat Assistant

1. Click the blue chat icon in the bottom-right corner
2. Ask questions about AI research trends, specific topics, or recent papers
3. The AI will search the vector database and provide contextual answers

**Example questions:**
- "What are the latest trends in Large Language Models?"
- "Summarize recent Computer Vision research"
- "What's new in Natural Language Processing?"

### Viewing Analytics

The dashboard displays:
- **Total Articles & Papers**: Real-time counts from all sources
- **Date Range**: Time period of collected data
- **Articles Over Time**: Monthly publication trends
- **Data Sources**: Distribution across different platforms
- **Trending Keywords**: Most frequently occurring AI topics

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Chart.js & react-chartjs-2** - Data visualizations
- **Lucide React** - Icon library

### Backend & AI
- **Google Gemini AI** - Text generation and embeddings
- **Pinecone** - Vector database for semantic search
- **RSS Parser** - Content scraping
- **ArXiv API** - Research paper fetching

## 📁 Project Structure

```
ai-knowledge-base/
├── app/
│   ├── api/
│   │   ├── analytics/route.ts    # Analytics data endpoint
│   │   ├── chat/route.ts          # AI chatbot endpoint
│   │   └── scrape/route.ts        # Data scraping endpoint
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main dashboard page
├── lib/
│   ├── analytics.ts               # Data analysis logic
│   ├── arxiv-fetcher.ts           # ArXiv API integration
│   ├── pinecone.ts                # Vector DB operations
│   └── rss-scraper.ts             # RSS feed scraping
├── public/                        # Static assets
├── .env.local                     # Environment variables (not in git)
├── package.json                   # Dependencies
└── README.md                      # This file
```

## 🔧 Configuration

### Data Sources

Edit `lib/rss-scraper.ts` to add or remove RSS feeds:

```typescript
const RSS_FEEDS = [
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch AI' },
  // Add more feeds...
];
```

### ArXiv Categories

Modify `lib/arxiv-fetcher.ts` to change research categories:

```typescript
const categories = ['cs.AI', 'cs.LG', 'cs.CL', 'cs.CV'];
```

## 📊 API Endpoints

### GET `/api/analytics`
Fetches aggregated analytics data including:
- Total articles and papers
- Topic trends and keywords
- Source breakdown
- Timeline data
- Date range

### POST `/api/scrape`
Triggers data scraping process:
- Fetches from all configured sources
- Processes and stores in Pinecone
- Returns updated analytics

### POST `/api/chat`
AI chatbot endpoint:
```json
{
  "message": "Your question here"
}
```

Returns AI-generated response with source context.

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- **Railway**
- **Render**
- **AWS Amplify**
- **DigitalOcean App Platform**

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Pinecone](https://www.pinecone.io/) - Vector Database
- [Google AI](https://ai.google/) - Gemini AI Models
- [Chart.js](https://www.chartjs.org/) - Data Visualization
- [ArXiv](https://arxiv.org/) - Research Papers API

## 📧 Support

For questions or issues, please open an issue on GitHub.

---

Built with ❤️ using Next.js, TypeScript, and AI
