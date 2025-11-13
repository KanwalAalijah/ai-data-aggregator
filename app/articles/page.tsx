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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto px-8 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <a href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Dashboard</span>
              </a>
              <h1 className="text-xl font-bold text-gray-900">Articles & Research Papers</h1>
            </div>
            <div className="flex space-x-8 text-sm font-medium">
              <a href="/" className="text-gray-500 hover:text-gray-900 transition">
                Dashboard
              </a>
              <span className="text-blue-600 border-b-2 border-blue-600 pb-1">Articles</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto px-8 py-10 max-w-7xl">
        {/* Header with Stats */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">All Articles & Papers</h2>
          <p className="text-gray-600">
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
              className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
            />
          </div>

          {/* Source Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer shadow-sm"
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
            <div className="text-gray-600">Loading articles...</div>
          </div>
        ) : currentArticles.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-600 mb-2">No articles found</p>
              <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {currentArticles.map((article) => (
              <div
                key={article.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xl font-bold text-gray-900 hover:text-blue-600 transition inline-flex items-center gap-2 group"
                    >
                      {article.title}
                      <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition" />
                    </a>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 mb-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Tag className="w-4 h-4" />
                    <span className="text-blue-600 font-medium">{article.source}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(article.date)}</span>
                  </div>
                  {article.authors && article.authors.length > 0 && (
                    <div className="text-gray-600">
                      <span className="text-gray-500">By:</span> {article.authors.join(', ')}
                    </div>
                  )}
                </div>

                {/* Content Preview */}
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  {truncateContent(article.content)}
                </p>

                {/* Categories */}
                {article.categories && article.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {article.categories.slice(0, 5).map((category, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium border border-gray-200"
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
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
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
                    className={`px-3 py-2 rounded-lg font-medium transition shadow-sm ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
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
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            >
              Next
            </button>
          </div>
        )}

        {/* Results Info */}
        {!loading && filteredArticles.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredArticles.length)} of{' '}
            {filteredArticles.length} articles
          </div>
        )}
      </main>
    </div>
  );
}
