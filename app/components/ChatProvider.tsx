'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface ChatContextType {
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  openChat: () => void;
  closeChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [isPanelAnimating, setIsPanelAnimating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Handle slide panel animation
  useEffect(() => {
    if (chatOpen) {
      setIsPanelAnimating(true);
    }
  }, [chatOpen]);

  const openChat = () => setChatOpen(true);

  const closeChat = () => {
    setIsPanelAnimating(false);
    setTimeout(() => {
      setChatOpen(false);
    }, 300); // Match transition duration
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = { role: 'user', text: inputMessage };
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
        const aiMessage: Message = { role: 'assistant', text: data.response };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          text: 'Sorry, I encountered an error: ' + data.error,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        text: 'Sorry, I encountered an error connecting to the server.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <ChatContext.Provider value={{ chatOpen, setChatOpen, openChat, closeChat }}>
      {children}

      {/* AI Assistant Slide Panel */}
      {chatOpen && (
        <>
          {/* Backdrop with Blur */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-all duration-300"
            onClick={closeChat}
          ></div>

          {/* Slide Panel */}
          <div className={`fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
            isPanelAnimating ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                </div>
                <button
                  onClick={closeChat}
                  className="text-gray-500 hover:text-gray-900 transition p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-gray-600 text-sm mb-4">
                      Hello! I can help you analyze the AI research and news data. Ask me anything!
                    </p>
                    <div className="space-y-2 w-full">
                      <button
                        onClick={() => {
                          setInputMessage('Can you give me a summary of the latest AI articles?');
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                        className="w-full text-left text-xs text-gray-700 bg-white border border-gray-200 p-3 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition"
                      >
                        Summarize the latest AI articles
                      </button>
                      <button
                        onClick={() => {
                          setInputMessage('What are the top trending topics in AI research?');
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                        className="w-full text-left text-xs text-gray-700 bg-white border border-gray-200 p-3 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition"
                      >
                        Show top trending topics
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => (
                      <div key={index} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                        <div
                          className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-900'
                          }`}
                        >
                          {msg.role === 'user' ? (
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                          ) : (
                            <div className="text-sm prose prose-gray prose-sm max-w-none">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                  ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                  strong: ({ children }) => (
                                    <strong className="font-bold text-gray-900">{children}</strong>
                                  ),
                                  em: ({ children }) => <em className="italic">{children}</em>,
                                  code: ({ children }) => (
                                    <code className="bg-gray-100 px-1 py-0.5 rounded text-blue-600 text-xs">
                                      {children}
                                    </code>
                                  ),
                                  pre: ({ children }) => (
                                    <pre className="bg-gray-100 p-2 rounded overflow-x-auto mb-2">{children}</pre>
                                  ),
                                }}
                              >
                                {msg.text}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {chatLoading && (
                  <div className="text-left">
                    <div className="inline-block px-4 py-2 rounded-lg bg-white border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: '150ms' }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: '300ms' }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">Analyzing...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer - Input */}
              <div className="border-t border-gray-200 p-6 bg-white">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !chatLoading && handleSendMessage()}
                    placeholder="Ask me about the data..."
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={chatLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={chatLoading || !inputMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm text-white font-medium transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </ChatContext.Provider>
  );
}
