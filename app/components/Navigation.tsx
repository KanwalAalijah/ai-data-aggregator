'use client';

import { useState } from 'react';
import { RefreshCw, Info, MessageCircle } from 'lucide-react';
import { useChat } from './ChatProvider';
import { usePathname } from 'next/navigation';

interface NavigationProps {
  onScrapeClick?: () => void;
  scraping?: boolean;
  onAboutClick?: () => void;
}

export default function Navigation({ onScrapeClick, scraping = false, onAboutClick }: NavigationProps) {
  const { openChat } = useChat();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto px-8 py-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">AI Knowledge Base</h1>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex space-x-8 text-sm font-medium">
              <a
                href="/"
                className={`transition pb-1 border-b-2 ${
                  isActive('/')
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </a>
              <a
                href="/articles"
                className={`transition pb-1 border-b-2 ${
                  isActive('/articles')
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Articles
              </a>
              {onScrapeClick && (
                <button
                  onClick={onScrapeClick}
                  disabled={scraping}
                  className="text-gray-500 hover:text-gray-700 transition pb-1 border-b-2 border-transparent hover:border-gray-300 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${scraping ? 'animate-spin' : ''}`} />
                  {scraping ? 'Scraping...' : 'Scrape Data'}
                </button>
              )}
              <button
                onClick={openChat}
                className="text-gray-500 hover:text-gray-700 transition pb-1 border-b-2 border-transparent hover:border-gray-300 flex items-center gap-1"
              >
                <MessageCircle className="w-4 h-4" />
                AI Assistant
              </button>
              {onAboutClick && (
                <button
                  onClick={onAboutClick}
                  className="text-gray-500 hover:text-gray-700 transition pb-1 border-b-2 border-transparent hover:border-gray-300 flex items-center gap-1"
                >
                  <Info className="w-4 h-4" />
                  About
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
