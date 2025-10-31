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
import { TrendingUp, Clock, Calendar, MessageCircle, X, RefreshCw } from 'lucide-react';

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

interface AnalyticsData {
  totalArticles: number;
  totalPapers: number;
  topicTrends: Array<{ keyword: string; count: number; percentage: number }>;
  sourceBreakdown: Array<{ source: string; count: number; percentage: number }>;
  recentItems: Array<any>;
  timeline: TimelineData[];
  dateRange: {
    earliest: string;
    latest: string;
  };
}

export default function Dashboard() {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [scraping, setScraping] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [chatLoading, setChatLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

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

  useEffect(() => {
    loadAnalytics();
  }, []);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  // Line chart data - Articles Over Time
  const lineChartData = analytics?.timeline
    ? {
        labels: analytics.timeline.map((item) => formatMonth(item.month)),
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

  const lineChartOptions = {
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
    scales: {
      y: {
        ticks: {
          color: '#6b7280',
        },
        grid: {
          color: '#374151',
        },
      },
      x: {
        ticks: {
          color: '#6b7280',
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

  const handleScrape = async () => {
    setScraping(true);
    try {
      const res = await fetch('/api/scrape', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully scraped and stored ${data.data.storedCount} items!`);
        setAnalytics(data.data.analytics);
        setLastRefresh(new Date().toISOString());
      } else {
        alert('Error scraping data: ' + data.error);
      }
    } catch (error) {
      console.error('Error scraping:', error);
      alert('Error scraping data');
    } finally {
      setScraping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = { role: 'user' as const, text: inputMessage };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputMessage }),
      });
      const data = await res.json();

      if (data.success) {
        const aiMessage = { role: 'assistant' as const, text: data.response };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        const errorMessage = { role: 'assistant' as const, text: 'Sorry, I encountered an error: ' + data.error };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { role: 'assistant' as const, text: 'Sorry, I encountered an error connecting to the server.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-[#1a1a1a]">
        <div className="mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-blue-400">Analytics Dashboard</h1>
              <button
                onClick={handleScrape}
                disabled={scraping}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <RefreshCw className={`w-4 h-4 ${scraping ? 'animate-spin' : ''}`} />
                <span>{scraping ? 'Scraping...' : 'Scrape Data'}</span>
              </button>
            </div>
            <div className="flex space-x-8 text-sm">
              {['Dashboard', 'Analytics', 'Reports', 'Settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`transition ${
                    activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto px-8 py-8 max-w-7xl">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading analytics...</div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Articles */}
              <div className="bg-[#1a1a1a] p-6 rounded-lg border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-gray-400">Total Articles</h3>
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                </div>
                <p className="text-4xl font-bold mb-1">
                  {analytics?.totalArticles.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-500">Across all indexed sources</p>
              </div>

              {/* Research Papers */}
              <div className="bg-[#1a1a1a] p-6 rounded-lg border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-gray-400">Research Papers</h3>
                  <Clock className="w-4 h-4 text-gray-500" />
                </div>
                <p className="text-4xl font-bold mb-1">
                  {analytics?.totalPapers.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-500">Peer-reviewed publications</p>
              </div>

              {/* Date Range */}
              <div className="bg-[#1a1a1a] p-6 rounded-lg border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-gray-400">Date Range</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">Currently selected period</p>
                <div className="flex items-center space-x-2 bg-[#0f0f0f] border border-gray-700 rounded px-3 py-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Line Chart */}
              <div className="bg-[#1a1a1a] p-6 rounded-lg border border-gray-800">
                <h3 className="text-lg font-semibold mb-2">Articles Over Time</h3>
                <p className="text-xs text-gray-500 mb-6">Monthly publication trends and growth.</p>
                {lineChartData ? (
                  <div className="h-64">
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
              <div className="bg-[#1a1a1a] p-6 rounded-lg border border-gray-800">
                <h3 className="text-lg font-semibold mb-2">Total Data Sources</h3>
                <p className="text-xs text-gray-500 mb-6">
                  Distribution of articles by originating platform.
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
                          <span className="text-xs text-gray-400">
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

            {/* Bag of Words */}
            <div className="bg-[#1a1a1a] p-6 rounded-lg border border-gray-800 mb-8">
              <h3 className="text-lg font-semibold mb-2">Trending Keywords</h3>
              <p className="text-xs text-gray-500 mb-4">Most frequently occurring keywords and topics.</p>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-[#2a2a2a] border border-gray-700 rounded text-sm hover:bg-[#3a3a3a] transition cursor-pointer"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* AI-Powered Analysis Summary */}
            <div className="bg-[#1a1a1a] p-6 rounded-lg border border-gray-800">
              <h3 className="text-lg font-semibold mb-3">AI-Powered Analysis Summary</h3>
              <p className="text-xs text-gray-500 mb-4">
                Key insights and actionable recommendations from recent data.
              </p>
              <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
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

      {/* AI Assistant Chat Interface */}
      {chatOpen ? (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-2xl flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h3 className="font-semibold">AI Assistant</h3>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-gray-400 text-sm mb-4">
                  Hello! I can help you analyze the AI research and news data. Ask me anything!
                </p>
                <div className="space-y-2 w-full">
                  <button
                    onClick={() => {
                      setInputMessage('Can you give me a summary of the latest AI articles?');
                      setTimeout(() => handleSendMessage(), 100);
                    }}
                    className="w-full text-left text-xs text-gray-400 bg-[#2a2a2a] p-3 rounded hover:bg-[#3a3a3a] transition"
                  >
                    📊 Summarize the latest AI articles
                  </button>
                  <button
                    onClick={() => {
                      setInputMessage('What are the top trending topics in AI research?');
                      setTimeout(() => handleSendMessage(), 100);
                    }}
                    className="w-full text-left text-xs text-gray-400 bg-[#2a2a2a] p-3 rounded hover:bg-[#3a3a3a] transition"
                  >
                    🔥 Show top trending topics
                  </button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`${
                      msg.role === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#2a2a2a] text-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                ))}</>
            )}
            {chatLoading && (
              <div className="text-left">
                <div className="inline-block px-4 py-2 rounded-lg bg-[#2a2a2a]">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400">Analyzing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-800">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !chatLoading && handleSendMessage()}
                placeholder="Ask me about the data..."
                className="flex-1 bg-[#0f0f0f] border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                disabled={chatLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={chatLoading || !inputMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-500">
        {lastRefresh && <p>Last updated: {new Date(lastRefresh).toLocaleString()}</p>}
      </footer>
    </div>
  );
}
