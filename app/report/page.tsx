'use client';

import { useState } from 'react';
import { FileText, TrendingUp, Lightbulb, Target, Tag, BarChart3, CheckCircle, Compass, Star, AlertCircle, Eye, Zap } from 'lucide-react';
import Navigation from '../components/Navigation';

interface PDFAnalysis {
  title: string;
  summary: string;
  keyMetrics: Array<{
    label: string;
    value: string;
    unit?: string;
  }>;
  insights: string[];
  categories: string[];
  dataPoints: Array<{
    category: string;
    value: number;
  }>;
  recommendations: string[];
  sentiment: string;
  dcaiAlignment?: {
    alignmentScore: number;
    strengths: string[];
    gaps: string[];
    alternativePerspectives: string[];
    strategicRecommendations: string[];
  };
}

export default function ReportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(0);
  const [analysis, setAnalysis] = useState<PDFAnalysis | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
      setExtractedText('');
      setPageCount(0);
      setAnalysis(null);
    } else {
      setError('Please select a valid PDF file');
      setFile(null);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // Dynamically import PDF.js only on client side
    const pdfjsLib = await import('pdfjs-dist');

    // Set up worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    setPageCount(pdf.numPages);

    let fullText = '';

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      fullText += `\n--- Page ${i} ---\n${pageText}\n`;
    }

    return fullText;
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    setError('');
    setExtractedText('');
    setAnalysis(null);

    try {
      // Step 1: Extract text from PDF
      const text = await extractTextFromPDF(file);
      setExtractedText(text);

      // Step 2: Analyze the extracted text with AI
      console.log('Sending text to AI for analysis...');
      const response = await fetch('/api/analyze-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await response.json();

      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        console.log('Analysis complete:', data.analysis);
      } else {
        setError('Failed to analyze PDF: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setError('Error processing PDF: ' + (err as Error).message);
      console.error('PDF processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="mx-auto px-8 py-10 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Upload PDF Report
          </h2>
          <p className="text-gray-600">
            Upload a PDF report to extract and analyze its content
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-8">
          <div className="space-y-6">
            {/* File Input */}
            <div>
              <label className="block text-gray-700 font-medium mb-3">
                Select PDF Report
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="block w-full text-gray-700 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer bg-gray-50 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Selected File Display */}
            {file && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  <span className="font-semibold">Selected:</span> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || isProcessing}
              className="w-full py-4 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {isProcessing ? 'Processing...' : 'Process PDF Report'}
            </button>
          </div>
        </div>

        {/* Generated Dashboard */}
        {analysis && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    {analysis.title}
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>
                <div className="ml-6">
                  <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700">
                    <FileText className="w-4 h-4 mr-2" />
                    {pageCount} pages
                  </span>
                </div>
              </div>

              {/* Sentiment Badge */}
              <div className="mt-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  analysis.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                  analysis.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                  analysis.sentiment === 'mixed' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  Sentiment: {analysis.sentiment.charAt(0).toUpperCase() + analysis.sentiment.slice(1)}
                </span>
              </div>
            </div>

            {/* DCAI Alignment Analysis */}
            {analysis.dcaiAlignment && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Compass className="w-6 h-6 mr-3 text-blue-600" />
                    DCAI Strategic Alignment
                  </h3>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-sm text-gray-600 font-medium">Alignment Score</div>
                      <div className="text-3xl font-bold text-blue-600">
                        {analysis.dcaiAlignment.alignmentScore}%
                      </div>
                    </div>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                      analysis.dcaiAlignment.alignmentScore >= 70 ? 'bg-green-100' :
                      analysis.dcaiAlignment.alignmentScore >= 40 ? 'bg-yellow-100' :
                      'bg-red-100'
                    }`}>
                      <Star className={`w-10 h-10 ${
                        analysis.dcaiAlignment.alignmentScore >= 70 ? 'text-green-600' :
                        analysis.dcaiAlignment.alignmentScore >= 40 ? 'text-yellow-600' :
                        'text-red-600'
                      }`} />
                    </div>
                  </div>
                </div>

                {/* Alignment Score Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Low Alignment</span>
                    <span>Perfect Alignment</span>
                  </div>
                  <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        analysis.dcaiAlignment.alignmentScore >= 70 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                        analysis.dcaiAlignment.alignmentScore >= 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                        'bg-gradient-to-r from-red-400 to-red-600'
                      }`}
                      style={{ width: `${analysis.dcaiAlignment.alignmentScore}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strengths */}
                  {analysis.dcaiAlignment.strengths && analysis.dcaiAlignment.strengths.length > 0 && (
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <Star className="w-5 h-5 mr-2 text-green-600" />
                        Strengths & Alignment
                      </h4>
                      <ul className="space-y-3">
                        {analysis.dcaiAlignment.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Gaps */}
                  {analysis.dcaiAlignment.gaps && analysis.dcaiAlignment.gaps.length > 0 && (
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
                        Gaps & Divergences
                      </h4>
                      <ul className="space-y-3">
                        {analysis.dcaiAlignment.gaps.map((gap, index) => (
                          <li key={index} className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Alternative Perspectives */}
                {analysis.dcaiAlignment.alternativePerspectives && analysis.dcaiAlignment.alternativePerspectives.length > 0 && (
                  <div className="mt-6 bg-white rounded-lg p-6 shadow-sm">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <Eye className="w-5 h-5 mr-2 text-purple-600" />
                      Alternative DCAI Perspectives
                    </h4>
                    <div className="space-y-4">
                      {analysis.dcaiAlignment.alternativePerspectives.map((perspective, index) => (
                        <div key={index} className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                          <p className="text-gray-800 text-sm leading-relaxed">
                            {perspective}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strategic Recommendations */}
                {analysis.dcaiAlignment.strategicRecommendations && analysis.dcaiAlignment.strategicRecommendations.length > 0 && (
                  <div className="mt-6 bg-white rounded-lg p-6 shadow-sm">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-blue-600" />
                      Strategic Recommendations for DCAI Alignment
                    </h4>
                    <ul className="space-y-3">
                      {analysis.dcaiAlignment.strategicRecommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 text-sm font-semibold">
                            {index + 1}
                          </div>
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Key Metrics Grid */}
            {analysis.keyMetrics && analysis.keyMetrics.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  Key Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {analysis.keyMetrics.map((metric, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                      <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        {metric.label}
                      </h4>
                      <p className="text-3xl font-bold text-gray-900">
                        {metric.value}
                        {metric.unit && <span className="text-lg text-gray-500 ml-1">{metric.unit}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {analysis.categories && analysis.categories.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-blue-600" />
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.categories.map((category, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {analysis.insights && analysis.insights.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                  Key Insights
                </h3>
                <ul className="space-y-3">
                  {analysis.insights.map((insight, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Data Visualization */}
            {analysis.dataPoints && analysis.dataPoints.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                  Data Points
                </h3>
                <div className="space-y-3">
                  {analysis.dataPoints.map((point, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-700 font-medium">{point.category}</span>
                      <div className="flex items-center">
                        <div className="w-48 h-6 bg-gray-100 rounded-full overflow-hidden mr-3">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (point.value / Math.max(...analysis.dataPoints.map(p => p.value))) * 100)}%`
                            }}
                          />
                        </div>
                        <span className="text-gray-900 font-semibold min-w-[60px] text-right">
                          {point.value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-purple-600" />
                  Recommendations
                </h3>
                <ul className="space-y-3">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 text-sm font-semibold">
                        {index + 1}
                      </div>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
