'use client';

import { useState, useEffect } from 'react';
import { Search, ExternalLink, Calendar, Tag, Filter, ArrowLeft } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  source: string;
  date: string;
  link: string;
  content: string;
  authors?: string[];
  categories?: string[];
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 20;

  // Load articles
  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/articles');
        const data = await res.json();
        if (data.success) {
          setArticles(data.articles);
          setFilteredArticles(data.articles);
        }
      } catch (error) {
        console.error('Error loading articles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, []);

  // Get unique sources for filter
  const sources = ['All', ...Array.from(new Set(articles.map((a) => a.source)))];

  // Filter articles based on search and source
  useEffect(() => {
    let filtered = articles;

    // Filter by source
    if (selectedSource !== 'All') {
      filtered = filtered.filter((article) => article.source === selectedSource);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.content.toLowerCase().includes(query) ||
          article.source.toLowerCase().includes(query)
      );
    }

    setFilteredArticles(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, selectedSource, articles]);

  // Pagination
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  const currentArticles = filteredArticles.slice(startIndex, endIndex);

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  };

  // Truncate content
  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-[#1a1a1a]">
        <div className="mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <a href="/" className="flex items-center space-x-2 text-gray-400 hover:text-white transition">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Dashboard</span>
              </a>
              <h1 className="text-xl font-bold text-blue-400">Articles & Research Papers</h1>
            </div>
            <div className="flex space-x-8 text-sm">
              <a href="/" className="text-gray-400 hover:text-white transition">
                Dashboard
              </a>
              <span className="text-white">Articles</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto px-8 py-8 max-w-7xl">
        {/* Header with Stats */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">All Articles & Papers</h2>
          <p className="text-gray-400">
            {loading ? 'Loading...' : `${filteredArticles.length} of ${articles.length} items`}
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles by title, content, or source..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Source Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Articles List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading articles...</div>
          </div>
        ) : currentArticles.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-400 mb-2">No articles found</p>
              <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {currentArticles.map((article) => (
              <div
                key={article.id}
                className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xl font-semibold text-white hover:text-blue-400 transition inline-flex items-center gap-2 group"
                    >
                      {article.title}
                      <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
                    </a>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 mb-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Tag className="w-4 h-4" />
                    <span className="text-blue-400">{article.source}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(article.date)}</span>
                  </div>
                  {article.authors && article.authors.length > 0 && (
                    <div className="text-gray-400">
                      <span className="text-gray-500">By:</span> {article.authors.join(', ')}
                    </div>
                  )}
                </div>

                {/* Content Preview */}
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                  {truncateContent(article.content)}
                </p>

                {/* Categories */}
                {article.categories && article.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {article.categories.slice(0, 5).map((category, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white hover:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg transition ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#1a1a1a] border border-gray-800 text-white hover:border-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white hover:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        )}

        {/* Results Info */}
        {!loading && filteredArticles.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-400">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredArticles.length)} of{' '}
            {filteredArticles.length} articles
          </div>
        )}
      </main>
    </div>
  );
}
