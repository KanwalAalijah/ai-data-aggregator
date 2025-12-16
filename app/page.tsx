'use client';

import { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { TrendingUp, Clock, Calendar, X, RefreshCw, Users, Trophy, Sparkles, ExternalLink, Info } from 'lucide-react';
import Navigation from './components/Navigation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface TimelineData {
  month: string;
  articles: number;
  papers: number;
  total: number;
}

interface ActiveSource {
  source: string;
  count: number;
  lastPublished: string;
}

interface AnalyticsData {
  totalArticles: number;
  totalPapers: number;
  totalSocialPosts: number;
  topicTrends: Array<{ keyword: string; count: number; percentage: number }>;
  sourceBreakdown: Array<{ source: string; count: number; percentage: number }>;
  recentItems: Array<any>;
  timeline: TimelineData[];
  dateRange: {
    earliest: string;
    latest: string;
  };
  mostActiveSourcesWeek: ActiveSource[];
  mostActiveSourcesMonth: ActiveSource[];
}

interface PredictionData {
  prediction: string;
  dataPoints: {
    totalItems: number;
    growthRate: string;
    topKeyword: string;
    dateRange: { earliest: string; latest: string };
  };
  lastGenerated: string;
}

// Available data sources
const DATA_SOURCES = [
  { id: 'techcrunch', name: 'TechCrunch AI', category: 'news' },
  { id: 'venturebeat', name: 'VentureBeat AI', category: 'news' },
  { id: 'mit', name: 'MIT Tech Review AI', category: 'news' },
  { id: 'nvidia', name: 'NVIDIA Blog', category: 'news' },
  { id: 'openai', name: 'OpenAI Blog', category: 'news' },
  { id: 'google', name: 'Google AI Blog', category: 'news' },
  { id: 'guardian', name: 'The Guardian AI', category: 'news' },
  { id: 'newsapi', name: 'News API (Aggregated)', category: 'news' },
  { id: 'reddit-machinelearning', name: 'Reddit - r/MachineLearning', category: 'social' },
  { id: 'reddit-artificial', name: 'Reddit - r/artificial', category: 'social' },
  { id: 'reddit-deeplearning', name: 'Reddit - r/deeplearning', category: 'social' },
  { id: 'reddit-datascience', name: 'Reddit - r/datascience', category: 'social' },
  { id: 'reddit-learnmachinelearning', name: 'Reddit - r/learnmachinelearning', category: 'social' },
  { id: 'hackernews', name: 'Hacker News (AI Stories)', category: 'social' },
  { id: 'arxiv-ai', name: 'ArXiv - AI', category: 'research' },
  { id: 'arxiv-ml', name: 'ArXiv - Machine Learning', category: 'research' },
  { id: 'arxiv-cl', name: 'ArXiv - Computation and Language', category: 'research' },
  { id: 'arxiv-cv', name: 'ArXiv - Computer Vision', category: 'research' },
  { id: 'semantic-scholar-ai', name: 'Semantic Scholar - AI', category: 'research' },
  { id: 'semantic-scholar-ml', name: 'Semantic Scholar - ML', category: 'research' },
  { id: 'semantic-scholar-nlp', name: 'Semantic Scholar - NLP', category: 'research' },
  { id: 'semantic-scholar-cv', name: 'Semantic Scholar - CV', category: 'research' },
  { id: 'semantic-scholar-dl', name: 'Semantic Scholar - Deep Learning', category: 'research' },
  { id: 'google-ai-principles', name: 'Google AI Principles', category: 'principles' },
  { id: 'oecd-ai-principles', name: 'OECD AI Principles', category: 'principles' },
  { id: 'eu-ai-guidelines', name: 'EU AI Guidelines', category: 'principles' },
];

export default function Dashboard() {
  const [scraping, setScraping] = useState(false);
  const [activeTab, setActiveTab] = useState('News Dashboard');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [isPanelAnimating, setIsPanelAnimating] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>(DATA_SOURCES.map(s => s.id));
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [activeSourcesTab, setActiveSourcesTab] = useState<'week' | 'month'>('week');
  const [showAboutModal, setShowAboutModal] = useState(true);

  // Load analytics data
  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
        setLastRefresh(data.lastRefresh);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load AI predictions for 2026
  const loadPredictions = async () => {
    setPredictionLoading(true);
    try {
      const res = await fetch('/api/predictions');
      const data = await res.json();
      if (data.success) {
        setPrediction(data);
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
    } finally {
      setPredictionLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    loadPredictions();
  }, []);

  // Handle slide panel animation
  useEffect(() => {
    if (showSourceModal) {
      setIsPanelAnimating(true);
    }
  }, [showSourceModal]);

  const closeSourcePanel = () => {
    setIsPanelAnimating(false);
    setTimeout(() => {
      setShowSourceModal(false);
    }, 300); // Match transition duration
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  // Line chart data - Articles Over Time
  const lineChartData = analytics?.timeline
    ? {
        labels: analytics.timeline.map((item) => item.month),
        datasets: [
          {
            label: 'Total Items',
            data: analytics.timeline.map((item) => item.total),
            borderColor: '#3b82f6',
            backgroundColor: '#3b82f6',
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      }
    : null;

  // Calculate max value for better Y-axis scaling
  const maxValue = analytics?.timeline
    ? Math.max(...analytics.timeline.map((item) => item.total))
    : 100;
  const suggestedMax = Math.ceil(maxValue * 1.15); // Add 15% padding above max value

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1f2937',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: suggestedMax,
        ticks: {
          color: '#6b7280',
          precision: 0,
          padding: 8,
        },
        grid: {
          color: '#e5e7eb',
        },
      },
      x: {
        ticks: {
          color: '#6b7280',
          maxRotation: 0,
          minRotation: 0,
          padding: 8,
          autoSkip: false,
        },
        grid: {
          display: false,
        },
      },
    },
  };

  // Donut chart data - Total Data Sources
  const donutChartData = analytics?.sourceBreakdown
    ? {
        labels: analytics.sourceBreakdown.map((item) => item.source),
        datasets: [
          {
            data: analytics.sourceBreakdown.map((item) => item.count),
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'],
            borderWidth: 0,
          },
        ],
      }
    : null;

  const donutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1f2937',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
      },
    },
    cutout: '70%',
  };

  const keywords =
    analytics?.topicTrends && analytics.topicTrends.length > 0
      ? analytics.topicTrends.slice(0, 14).map((trend) => trend.keyword)
      : [
          'AI',
          'Machine Learning',
          'Deep Learning',
          'Natural Language Processing',
          'Computer Vision',
          'Data Science',
          'Neural Networks',
          'Robotics',
          'Big Data',
          'Reinforcement Learning',
          'Ethics',
          'Automation',
          'Algorithms',
          'Predictive Analytics',
        ];

  const toggleSource = (sourceId: string) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const toggleAllSources = (category?: string) => {
    if (category) {
      const categorySources = DATA_SOURCES.filter((s) => s.category === category).map((s) => s.id);
      const allSelected = categorySources.every((id) => selectedSources.includes(id));

      if (allSelected) {
        setSelectedSources((prev) => prev.filter((id) => !categorySources.includes(id)));
      } else {
        setSelectedSources((prev) => [...new Set([...prev, ...categorySources])]);
      }
    } else {
      if (selectedSources.length === DATA_SOURCES.length) {
        setSelectedSources([]);
      } else {
        setSelectedSources(DATA_SOURCES.map((s) => s.id));
      }
    }
  };

  const handleScrape = async () => {
    if (selectedSources.length === 0) {
      alert('Please select at least one source to scrape');
      return;
    }

    closeSourcePanel();
    setScraping(true);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: selectedSources }),
      });
      const data = await res.json();
      if (data.success) {
        const { totalFetched, newCount, duplicateCount, errorCount } = data.data;

        let message = '';
        if (newCount > 0 && duplicateCount > 0) {
          message = `✅ Scraped ${totalFetched} items:\n• ${newCount} new items stored\n• ${duplicateCount} already in database`;
        } else if (newCount > 0) {
          message = `✅ Successfully stored ${newCount} new items!`;
        } else if (duplicateCount > 0) {
          message = `ℹ️ Scraped ${totalFetched} items but all were already in database`;
        } else {
          message = '⚠️ No items were scraped';
        }

        if (errorCount > 0) {
          message += `\n\n⚠️ ${errorCount} items failed to store`;
        }

        alert(message);

        // Reload full analytics from database
        await loadAnalytics();

        // Also reload predictions
        await loadPredictions();
      } else {
        alert('❌ Error scraping data: ' + data.error);
      }
    } catch (error) {
      console.error('Error scraping:', error);
      alert('Error scraping data');
    } finally {
      setScraping(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation
        onScrapeClick={() => setShowSourceModal(true)}
        scraping={scraping}
        onAboutClick={() => setShowAboutModal(true)}
      />

      {/* Main Content */}
      <main className="mx-auto px-8 py-10 max-w-7xl">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Loading analytics...</div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {/* Total Articles */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Articles</h3>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-2">
                  {analytics?.totalArticles.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-500">Across all indexed sources</p>
              </div>

              {/* Research Papers */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Research Papers</h3>
                  <Clock className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-2">
                  {analytics?.totalPapers.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-500">Peer-reviewed publications</p>
              </div>

              {/* Social Posts */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Social Posts</h3>
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-2">
                  {analytics?.totalSocialPosts.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-500">From Reddit & Hacker News</p>
              </div>

              {/* Date Range */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Date Range</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">Currently selected period</p>
                <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 font-medium">
                    {analytics?.dateRange
                      ? `${new Date(analytics.dateRange.earliest).toLocaleDateString('en-US', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                        })} - ${new Date(analytics.dateRange.latest).toLocaleDateString('en-US', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                        })}`
                      : 'No data yet'}
                  </span>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              {/* Line Chart */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Articles Over Time - 2025</h3>
                <p className="text-sm text-gray-500 mb-6">Monthly publication trends for 2025</p>
                {lineChartData ? (
                  <div className="h-80 w-full relative">
                    <Line data={lineChartData} options={lineChartOptions} />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <p className="mb-4">No data available yet</p>
                      <button
                        onClick={handleScrape}
                        disabled={scraping}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {scraping ? 'Scraping...' : 'Scrape Data to View Chart'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Donut Chart */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Total Data Sources</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Distribution of articles by originating platform
                </p>
                {donutChartData ? (
                  <>
                    <div className="flex items-center justify-center">
                      <div className="h-64 w-64 relative">
                        <Doughnut data={donutChartData} options={donutChartOptions} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-6">
                      {analytics?.sourceBreakdown.map((source, index) => (
                        <div key={source.source} className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'][
                                index % 6
                              ],
                            }}
                          ></div>
                          <span className="text-xs text-gray-600">
                            {source.source} ({source.percentage.toFixed(0)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <p className="mb-4">No data available yet</p>
                      <button
                        onClick={handleScrape}
                        disabled={scraping}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {scraping ? 'Scraping...' : 'Scrape Data to View Chart'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Trending Keywords */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Trending Keywords</h3>
              <p className="text-sm text-gray-500 mb-6">Most frequently occurring keywords and topics</p>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-100 hover:border-gray-300 transition cursor-pointer"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* New Sections Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Most Active Sources */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-lg font-bold text-gray-900">Most Active Sources</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveSourcesTab('week')}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                        activeSourcesTab === 'week'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setActiveSourcesTab('month')}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                        activeSourcesTab === 'month'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Month
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Top publishing sources in the last {activeSourcesTab === 'week' ? '7 days' : '30 days'}
                </p>
                <div className="space-y-3">
                  {analytics && (activeSourcesTab === 'week' ? analytics.mostActiveSourcesWeek : analytics.mostActiveSourcesMonth).length > 0 ? (
                    (activeSourcesTab === 'week' ? analytics.mostActiveSourcesWeek : analytics.mostActiveSourcesMonth).map((source, index) => (
                      <div key={source.source} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{source.source}</p>
                            <p className="text-xs text-gray-500">
                              Last published: {new Date(source.lastPublished).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">{source.count}</p>
                          <p className="text-xs text-gray-500">items</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No data available for this period</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Additions Feed */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-bold text-gray-900">Recent Additions</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">Latest items added to the database</p>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {analytics && analytics.recentItems.length > 0 ? (
                    analytics.recentItems.slice(0, 10).map((item, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition line-clamp-2"
                            >
                              {item.title}
                            </a>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">{item.source}</span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {new Date(item.pubDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No recent items yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2026 Trends Prediction */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200 shadow-sm mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">AI-Powered 2026 Trends Prediction</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Based on analysis of {prediction?.dataPoints.totalItems.toLocaleString()} items from our database
              </p>
              {predictionLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-gray-600">Analyzing trends and generating predictions...</span>
                  </div>
                </div>
              ) : prediction ? (
                <div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {prediction.prediction}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Total Items</p>
                      <p className="text-lg font-bold text-blue-600">{prediction.dataPoints.totalItems.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Growth Rate</p>
                      <p className="text-lg font-bold text-green-600">{prediction.dataPoints.growthRate}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Top Keyword</p>
                      <p className="text-lg font-bold text-purple-600">{prediction.dataPoints.topKeyword}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Generated</p>
                      <p className="text-xs font-medium text-gray-600">
                        {new Date(prediction.lastGenerated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={loadPredictions}
                    className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm text-white font-medium transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate Prediction
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Unable to generate predictions</p>
                  <button
                    onClick={loadPredictions}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm text-white font-medium transition shadow-sm"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>

            {/* AI-Powered Analysis Summary */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-3">AI-Powered Analysis Summary</h3>
              <p className="text-sm text-gray-500 mb-4">
                Key insights and actionable recommendations from recent data
              </p>
              <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                <p>
                  This dashboard aggregates the latest AI research and news from multiple sources including
                  TechCrunch, VentureBeat, MIT Tech Review, NVIDIA, OpenAI, Google AI Blog, and ArXiv. The
                  data is automatically scraped, processed, and stored in a vector database for semantic
                  search capabilities.
                </p>
                <p>
                  The analysis reveals emerging trends in AI research and development, with particular focus
                  on Large Language Models, Computer Vision, Natural Language Processing, and Deep Learning.
                  Use the AI Assistant chat to ask specific questions about the collected data.
                </p>
                <p>
                  {analytics
                    ? `Currently tracking ${
                        analytics.totalArticles + analytics.totalPapers
                      } total items from ${analytics.sourceBreakdown.length} different sources. Click "Scrape Data" to fetch the latest updates.`
                    : 'Click "Scrape Data" to begin collecting AI research and news data.'}
                </p>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Source Selection Slide Panel */}
      {showSourceModal && (
        <>
          {/* Backdrop with Blur */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-all duration-300"
            onClick={closeSourcePanel}
          ></div>

          {/* Slide Panel */}
          <div className={`fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
            isPanelAnimating ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Select Data Sources</h2>
                  <p className="text-sm text-gray-500 mt-1">Choose sources to scrape</p>
                </div>
                <button
                  onClick={closeSourcePanel}
                  className="text-gray-500 hover:text-gray-900 transition p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">

            {/* Select All */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                <input
                  type="checkbox"
                  checked={selectedSources.length === DATA_SOURCES.length}
                  onChange={() => toggleAllSources()}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="font-semibold text-gray-900">Select All Sources</span>
                <span className="text-sm text-gray-500">({selectedSources.length}/{DATA_SOURCES.length})</span>
              </label>
            </div>

            {/* News Sources */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-blue-600">News Sources</h3>
                <button
                  onClick={() => toggleAllSources('news')}
                  className="text-xs text-gray-600 hover:text-gray-900 transition font-medium"
                >
                  {DATA_SOURCES.filter(s => s.category === 'news').every(s => selectedSources.includes(s.id))
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>
              <div className="space-y-2 ml-4">
                {DATA_SOURCES.filter((source) => source.category === 'news').map((source) => (
                  <label
                    key={source.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSources.includes(source.id)}
                      onChange={() => toggleSource(source.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">{source.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Research Sources */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-blue-600">Research Papers (ArXiv)</h3>
                <button
                  onClick={() => toggleAllSources('research')}
                  className="text-xs text-gray-600 hover:text-gray-900 transition font-medium"
                >
                  {DATA_SOURCES.filter(s => s.category === 'research').every(s => selectedSources.includes(s.id))
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>
              <div className="space-y-2 ml-4">
                {DATA_SOURCES.filter((source) => source.category === 'research').map((source) => (
                  <label
                    key={source.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSources.includes(source.id)}
                      onChange={() => toggleSource(source.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">{source.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Social Media */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-blue-600">Social Media & Communities</h3>
                <button
                  onClick={() => toggleAllSources('social')}
                  className="text-xs text-gray-600 hover:text-gray-900 transition font-medium"
                >
                  {DATA_SOURCES.filter(s => s.category === 'social').every(s => selectedSources.includes(s.id))
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>
              <div className="space-y-2 ml-4">
                {DATA_SOURCES.filter((source) => source.category === 'social').map((source) => (
                  <label
                    key={source.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSources.includes(source.id)}
                      onChange={() => toggleSource(source.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">{source.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* AI Principles & Guidelines */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-blue-600">AI Principles & Guidelines</h3>
                <button
                  onClick={() => toggleAllSources('principles')}
                  className="text-xs text-gray-600 hover:text-gray-900 transition font-medium"
                >
                  {DATA_SOURCES.filter(s => s.category === 'principles').every(s => selectedSources.includes(s.id))
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>
              <div className="space-y-2 ml-4">
                {DATA_SOURCES.filter((source) => source.category === 'principles').map((source) => (
                  <label
                    key={source.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSources.includes(source.id)}
                      onChange={() => toggleSource(source.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">{source.name}</span>
                  </label>
                ))}
              </div>
            </div>

              </div>

              {/* Footer - Actions */}
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleScrape}
                    disabled={selectedSources.length === 0}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Scrape {selectedSources.length} Source{selectedSources.length !== 1 ? 's' : ''}
                  </button>
                  <button
                    onClick={closeSourcePanel}
                    className="w-full px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Data Aggregator</h2>
                <p className="text-sm text-gray-500">Full-Stack Analytics Dashboard</p>
              </div>
              <button
                onClick={() => setShowAboutModal(false)}
                className="text-gray-500 hover:text-gray-900 transition p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Project Description */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                What This Project Does
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                This is a comprehensive AI news and research aggregation platform that automatically scrapes,
                processes, and analyzes content from multiple sources including tech blogs, research papers,
                and social media communities. The dashboard provides real-time analytics, trend visualization,
                and AI-powered insights.
              </p>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span><strong>Multi-source Data Scraping:</strong> Aggregates content from TechCrunch, VentureBeat, MIT Tech Review, ArXiv, Reddit, and more</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span><strong>Vector Database Storage:</strong> Uses Pinecone for semantic search and efficient data retrieval</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span><strong>AI-Powered Analysis:</strong> Integrates with OpenAI for trend predictions and intelligent chat assistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span><strong>Interactive Visualizations:</strong> Dynamic charts showing publication trends, source distribution, and keyword analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span><strong>Chat with Your Data:</strong> AI-powered chat assistant that lets you ask questions and gather insights from all scraped documents using RAG (Retrieval-Augmented Generation)</span>
                </li>
              </ul>
            </div>

            {/* Tech Stack */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Tech Stack
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Frontend */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3">Frontend</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS', 'Chart.js', 'Lucide Icons'].map((tech) => (
                      <span key={tech} className="px-3 py-1 bg-white text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Backend */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3">Backend & APIs</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Next.js API Routes', 'REST APIs', 'Web Scraping', 'RSS Parsing', 'Data Processing'].map((tech) => (
                      <span key={tech} className="px-3 py-1 bg-white text-green-700 text-xs font-medium rounded-full border border-green-200">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* AI & ML */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-3">AI & Machine Learning</h4>
                  <div className="flex flex-wrap gap-2">
                    {['OpenAI GPT-4', 'Embeddings', 'Vector Search', 'Semantic Analysis', 'NLP'].map((tech) => (
                      <span key={tech} className="px-3 py-1 bg-white text-purple-700 text-xs font-medium rounded-full border border-purple-200">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Database & Infrastructure */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-3">Database & Infrastructure</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Pinecone', 'Vector Database', 'Vercel', 'Serverless', 'Environment Config'].map((tech) => (
                      <span key={tech} className="px-3 py-1 bg-white text-orange-700 text-xs font-medium rounded-full border border-orange-200">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowAboutModal(false)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition"
              >
                Explore Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400 bg-gray-50 border-t border-gray-200">
        {lastRefresh && <p>Last updated: {new Date(lastRefresh).toLocaleString()}</p>}
      </footer>
    </div>
  );
}
