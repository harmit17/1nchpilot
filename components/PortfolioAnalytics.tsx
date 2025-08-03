'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  Wallet,
  DollarSign,
  Target,
  Shield,
  Lightbulb,
  Activity,
  X,
  PieChart,
  LineChart
} from 'lucide-react';
import { 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PortfolioReport, ReportGenerationRequest } from '@/types';

interface PortfolioAnalyticsProps {
  onClose?: () => void;
}

export default function PortfolioAnalytics({ onClose }: PortfolioAnalyticsProps) {
  const [walletAddress, setWalletAddress] = useState('');
  const [chainId, setChainId] = useState(1); // Ethereum mainnet default
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<PortfolioReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiModel, setAiModel] = useState<string>('');
  
  // AI Q&A State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [qaHistory, setQaHistory] = useState<Array<{question: string, answer: string}>>([]);
  const [showAIChat, setShowAIChat] = useState(false);

  const handleGenerateReport = async () => {
    if (!walletAddress) {
      setError('Please enter a wallet address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestData: ReportGenerationRequest = {
        walletAddress: walletAddress.trim(),
        chainId,
        timeframe: '30d',
        includeTransactionHistory: true,
        includeAIInsights: true
      };

      const response = await fetch('/api/portfolio/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }

      setReport(data.report);
      
      // Determine which AI model was used based on console logs or response
      if (data.report?.aiInsights?.portfolioSummary) {
        setAiModel('AI-Powered');
      } else {
        setAiModel('Demo Analytics');
      }
      
    } catch (err: any) {
      console.error('❌ Error generating report:', err);
      setError(err.message || 'Failed to generate portfolio report');
    } finally {
      setLoading(false);
    }
  };

  const handleAIQuestion = async () => {
    if (!aiQuestion.trim() || !report) {
      return;
    }

    setAiLoading(true);
    try {
      // Create context from the current report
      const context = {
        totalValue: report.metrics.totalValue,
        tokenCount: report.metrics.tokenCount,
        netPnL: report.metrics.netPnL,
        topHoldings: report.tokenAnalytics.slice(0, 5).map(t => ({ symbol: t.symbol, value: t.balanceUSD, percentage: t.percentage })),
        riskScore: report.aiInsights.riskAssessment.score,
        portfolioSummary: report.aiInsights.portfolioSummary,
        strengths: report.aiInsights.strengths,
        weaknesses: report.aiInsights.weaknesses
      };

      const response = await fetch('/api/portfolio/ai-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: aiQuestion,
          context: context,
          walletAddress: report.walletAddress
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAiAnswer(data.answer);
        setQaHistory(prev => [...prev, { question: aiQuestion, answer: data.answer }]);
        setAiQuestion('');
      } else {
        setAiAnswer('Sorry, I encountered an error while processing your question. Please try again.');
      }
    } catch (error) {
      console.error('Error asking AI question:', error);
      setAiAnswer('Sorry, I encountered an error while processing your question. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const downloadReport = async () => {
    if (!report) return;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 0;
      const margin = 15;
      const contentWidth = pageWidth - (2 * margin);

      // Modern color palette
      const theme = {
        primary: [0, 123, 255],      // Modern blue
        success: [40, 167, 69],      // Green
        warning: [255, 193, 7],      // Yellow
        danger: [220, 53, 69],       // Red
        dark: [52, 58, 64],          // Dark gray
        light: [248, 249, 250],      // Light gray
        white: [255, 255, 255],
        accent: [102, 16, 242]       // Purple
      };

      let currentPage = 1;

      // Helper functions
      const addPage = () => {
        pdf.addPage();
        currentPage++;
        yPosition = margin;
      };

      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - 25) {
          addPage();
          return true;
        }
        return false;
      };

      const addHeader = (isFirstPage = false) => {
        if (isFirstPage) {
          // Elegant cover header
          pdf.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2]);
          pdf.rect(0, 0, pageWidth, 70, 'F');
          
          // Logo area
          pdf.setFillColor(255, 255, 255, 0.1);
          pdf.circle(pageWidth - 25, 25, 20, 'F');
          
          // Main title
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(32);
          pdf.setFont('helvetica', 'bold');
          pdf.text('1NCHPILOT', margin, 30);
          
          pdf.setFontSize(18);
          pdf.setFont('helvetica', 'normal');
          pdf.text('Portfolio Analytics Report', margin, 45);
          
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          pdf.text('Powered by Advanced AI Analytics', margin, 58);
          
          return 80;
        } else {
          // Simple header for other pages
          pdf.setFillColor(theme.light[0], theme.light[1], theme.light[2]);
          pdf.rect(0, 0, pageWidth, 20, 'F');
          
          pdf.setTextColor(theme.dark[0], theme.dark[1], theme.dark[2]);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text('1NCHPILOT Portfolio Report', margin, 12);
          
          return 25;
        }
      };

      const addFooter = () => {
        // Footer line
        pdf.setDrawColor(220, 220, 220);
        pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        
        pdf.setTextColor(128, 128, 128);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        
        // Left side - generation info
        const date = new Date().toLocaleDateString();
        pdf.text(`Generated ${date}`, margin, pageHeight - 8);
        
        // Center - company info
        pdf.text('1nchPilot.com', pageWidth / 2 - 15, pageHeight - 8);
        
        // Right side - page number
        pdf.text(`Page ${currentPage}`, pageWidth - margin - 20, pageHeight - 8);
      };

      const addCard = (x: number, y: number, width: number, height: number, title: string, value: string, subtitle: string, color = theme.primary) => {
        // Card shadow effect
        pdf.setFillColor(0, 0, 0, 0.1);
        pdf.roundedRect(x + 1, y + 1, width, height, 3, 3, 'F');
        
        // Card background
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x, y, width, height, 3, 3, 'F');
        
        // Card border
        pdf.setDrawColor(230, 230, 230);
        pdf.roundedRect(x, y, width, height, 3, 3, 'S');
        
        // Color accent bar
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.roundedRect(x, y, width, 4, 3, 3, 'F');
        
        // Title
        pdf.setTextColor(theme.dark[0], theme.dark[1], theme.dark[2]);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(title, x + 5, y + 15);
        
        // Value
        pdf.setTextColor(color[0], color[1], color[2]);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(value, x + 5, y + 25);
        
        // Subtitle
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.text(subtitle, x + 5, y + 32);
      };

      const addSection = (title: string) => {
        checkPageBreak(30);
        
        // Section background
        pdf.setFillColor(theme.light[0], theme.light[1], theme.light[2]);
        pdf.roundedRect(margin, yPosition, contentWidth, 12, 2, 2, 'F');
        
        // Section title
        pdf.setTextColor(theme.dark[0], theme.dark[1], theme.dark[2]);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin + 5, yPosition + 8);
        
        yPosition += 18;
        return yPosition;
      };

      // Start building the PDF
      // === PAGE 1: COVER & EXECUTIVE SUMMARY ===
      yPosition = addHeader(true);
      
      // Executive Summary Card
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(margin, yPosition, contentWidth, 40, 5, 5, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.roundedRect(margin, yPosition, contentWidth, 40, 5, 5, 'S');
      
      pdf.setTextColor(theme.dark[0], theme.dark[1], theme.dark[2]);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Executive Summary', margin + 8, yPosition + 12);
      
      const walletShort = `${report.walletAddress.slice(0, 6)}...${report.walletAddress.slice(-4)}`;
      const reportDate = new Date(report.generatedAt).toLocaleDateString();
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const chainName = chainId === 1 ? 'Ethereum' : 'Arbitrum';
      const summaryText = `This comprehensive analysis covers wallet ${walletShort} on ${chainName} network as of ${reportDate}. Our AI-powered system analyzed ${report.metrics.tokenCount} tokens with a total value of $${report.metrics.totalValue.toLocaleString()}, providing actionable insights for portfolio optimization.`;
      
      const lines = pdf.splitTextToSize(summaryText, contentWidth - 16);
      lines.forEach((line: string, index: number) => {
        pdf.text(line, margin + 8, yPosition + 22 + (index * 5));
      });
      
      yPosition += 50;

      // Key Metrics Cards Grid
      const cardWidth = (contentWidth - 10) / 2;
      const cardHeight = 35;
      
      // Row 1
      const pnlColor = report.metrics.netPnL >= 0 ? theme.success : theme.danger;
      addCard(margin, yPosition, cardWidth, cardHeight, 'Portfolio Value', `$${report.metrics.totalValue.toLocaleString()}`, 'Total USD Value', theme.primary);
      addCard(margin + cardWidth + 5, yPosition, cardWidth, cardHeight, 'Net P&L', `$${report.metrics.netPnL.toLocaleString()}`, `${report.metrics.netPnLPercent.toFixed(2)}% ROI`, pnlColor);
      
      yPosition += cardHeight + 8;
      
      // Row 2
      const riskColor = report.aiInsights.riskAssessment.score <= 3 ? theme.success : 
                       report.aiInsights.riskAssessment.score <= 6 ? theme.warning : theme.danger;
      addCard(margin, yPosition, cardWidth, cardHeight, 'Token Count', report.metrics.tokenCount.toString(), 'Unique Assets', theme.accent);
      addCard(margin + cardWidth + 5, yPosition, cardWidth, cardHeight, 'Risk Score', `${report.aiInsights.riskAssessment.score}/10`, 'AI Risk Assessment', riskColor);
      
      yPosition += cardHeight + 15;

      // === PAGE 2: PORTFOLIO ANALYSIS ===
      addPage();
      yPosition = addHeader();
      
      // Portfolio Breakdown
      addSection('Portfolio Breakdown');
      
      // Top Holdings Table
      const tableY = yPosition;
      const colWidths = [contentWidth * 0.4, contentWidth * 0.3, contentWidth * 0.3];
      
      // Table header
      pdf.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2]);
      pdf.rect(margin, tableY, contentWidth, 10, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Token', margin + 3, tableY + 6);
      pdf.text('Value', margin + colWidths[0] + 3, tableY + 6);
      pdf.text('Allocation', margin + colWidths[0] + colWidths[1] + 3, tableY + 6);
      
      yPosition = tableY + 12;
      
      // Table rows
      report.tokenAnalytics.slice(0, 8).forEach((token, index) => {
        const rowColor = index % 2 === 0 ? [249, 250, 251] : [255, 255, 255];
        pdf.setFillColor(rowColor[0], rowColor[1], rowColor[2]);
        pdf.rect(margin, yPosition - 2, contentWidth, 8, 'F');
        
        pdf.setTextColor(theme.dark[0], theme.dark[1], theme.dark[2]);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        
        pdf.text(token.symbol, margin + 3, yPosition + 4);
        pdf.text(`$${token.balanceUSD.toLocaleString()}`, margin + colWidths[0] + 3, yPosition + 4);
        pdf.text(`${token.percentage.toFixed(1)}%`, margin + colWidths[0] + colWidths[1] + 3, yPosition + 4);
        
        yPosition += 8;
      });
      
      yPosition += 10;

      // AI Analysis Section
      addSection('AI-Powered Analysis');
      
      // Portfolio Summary Box
      pdf.setFillColor(240, 248, 255);
      pdf.roundedRect(margin, yPosition, contentWidth, 25, 3, 3, 'F');
      pdf.setDrawColor(theme.primary[0], theme.primary[1], theme.primary[2]);
      pdf.roundedRect(margin, yPosition, contentWidth, 25, 3, 3, 'S');
      
      pdf.setTextColor(theme.dark[0], theme.dark[1], theme.dark[2]);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      const summaryLines = pdf.splitTextToSize(report.aiInsights.portfolioSummary, contentWidth - 10);
      summaryLines.forEach((line: string, index: number) => {
        pdf.text(line, margin + 5, yPosition + 8 + (index * 4));
      });
      
      yPosition += 30;

      // === PAGE 3: RISK ANALYSIS ===
      addPage();
      yPosition = addHeader();
      
      addSection('Risk Assessment');
      
      // Risk Score Visualization
      const riskScore = report.aiInsights.riskAssessment.score;
      
      // Risk meter background
      pdf.setFillColor(240, 240, 240);
      pdf.roundedRect(margin, yPosition, contentWidth, 20, 3, 3, 'F');
      
      // Risk level text
      pdf.setTextColor(theme.dark[0], theme.dark[1], theme.dark[2]);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Risk Level: ${riskScore}/10`, margin + 5, yPosition + 10);
      
      const riskText = riskScore <= 3 ? 'Conservative' : riskScore <= 6 ? 'Moderate' : 'Aggressive';
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`(${riskText})`, margin + 60, yPosition + 10);
      
      // Risk progress bar
      const barY = yPosition + 12;
      const barWidth = contentWidth - 10;
      const barHeight = 6;
      
      // Background bar
      pdf.setFillColor(220, 220, 220);
      pdf.roundedRect(margin + 5, barY, barWidth, barHeight, 3, 3, 'F');
      
      // Progress bar
      const progressWidth = (riskScore / 10) * barWidth;
      const progressColor = riskScore <= 3 ? theme.success : riskScore <= 6 ? theme.warning : theme.danger;
      pdf.setFillColor(progressColor[0], progressColor[1], progressColor[2]);
      pdf.roundedRect(margin + 5, barY, progressWidth, barHeight, 3, 3, 'F');
      
      yPosition += 30;

      // Risk Factors
      pdf.setTextColor(theme.dark[0], theme.dark[1], theme.dark[2]);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Key Risk Factors:', margin, yPosition);
      yPosition += 8;

      report.aiInsights.riskAssessment.factors.slice(0, 4).forEach((factor, index) => {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        const factorLines = pdf.splitTextToSize(`• ${factor}`, contentWidth - 10);
        factorLines.forEach((line: string, lineIndex: number) => {
          pdf.text(line, margin + 5, yPosition + (lineIndex * 4));
        });
        yPosition += factorLines.length * 4 + 2;
      });

      yPosition += 10;

      // Recommendations
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AI Recommendations:', margin, yPosition);
      yPosition += 8;

      report.aiInsights.riskAssessment.recommendations.slice(0, 3).forEach((rec, index) => {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        const recLines = pdf.splitTextToSize(`${index + 1}. ${rec}`, contentWidth - 10);
        recLines.forEach((line: string, lineIndex: number) => {
          pdf.text(line, margin + 5, yPosition + (lineIndex * 4));
        });
        yPosition += recLines.length * 4 + 3;
      });

      // Additional Portfolio Insights
      yPosition += 15;
      addSection('Portfolio Performance Summary');
      
      // Performance metrics in a clean table format
      const performanceY = yPosition;
      
      // Create a summary table mimicking the webpage
      const summaryData = [
        ['Portfolio Value', `$${report.metrics.totalValue.toLocaleString()}`],
        ['Net P&L', `$${report.metrics.netPnL.toLocaleString()}`],
        ['ROI', `${report.metrics.netPnLPercent.toFixed(2)}%`],
        ['Total Tokens', report.metrics.tokenCount.toString()],
        ['Risk Score', `${report.aiInsights.riskAssessment.score}/10`]
      ];
      
      summaryData.forEach((row, index) => {
        const rowY = performanceY + (index * 10);
        
        // Alternating row colors
        if (index % 2 === 0) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(margin, rowY - 2, contentWidth, 10, 'F');
        }
        
        pdf.setTextColor(theme.dark[0], theme.dark[1], theme.dark[2]);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(row[0], margin + 5, rowY + 4);
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(row[1], margin + contentWidth - 50, rowY + 4);
      });
      
      yPosition = performanceY + (summaryData.length * 10) + 15;

      // Add footer to all pages
      for (let page = 1; page <= pdf.getNumberOfPages(); page++) {
        pdf.setPage(page);
        currentPage = page;
        addFooter();
      }

      // Save with professional filename
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `1nchpilot-portfolio-analysis-${walletShort}-${timestamp}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating professional PDF report:', error);
      
      // Simple fallback
      const pdf = new jsPDF();
      pdf.setFontSize(16);
      pdf.text('Portfolio Analytics Report', 20, 20);
      pdf.setFontSize(12);
      pdf.text(`Total Value: $${report.metrics.totalValue.toFixed(2)}`, 20, 40);
      pdf.text(`Token Count: ${report.metrics.tokenCount}`, 20, 50);
      pdf.text(`Net P&L: $${report.metrics.netPnL.toFixed(2)}`, 20, 60);
      
      const fileName = `portfolio-report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    }
  };

  const generateTextReport = (report: PortfolioReport): string => {
    const date = new Date(report.generatedAt).toLocaleDateString();
    
    return `
PORTFOLIO ANALYTICS REPORT
Generated: ${date}
Wallet: ${report.walletAddress}
Chain: ${report.chainId}

=== PORTFOLIO OVERVIEW ===
Total Value: $${report.metrics.totalValue.toFixed(2)}
Token Count: ${report.metrics.tokenCount}
Net P&L: $${report.metrics.netPnL.toFixed(2)} (${report.metrics.netPnLPercent.toFixed(2)}%)
24h Change: ${report.metrics.totalValueChangePercent24h.toFixed(2)}%
Volatility: ${report.metrics.volatility.toFixed(2)}%

=== TOP HOLDINGS ===
${report.tokenAnalytics.slice(0, 10).map(token => 
  `${token.symbol}: $${token.balanceUSD.toFixed(2)} (${token.percentage.toFixed(1)}%)`
).join('\n')}

=== AI INSIGHTS ===
${report.aiInsights.portfolioSummary}

STRENGTHS:
${report.aiInsights.strengths.map(s => `• ${s}`).join('\n')}

AREAS FOR IMPROVEMENT:
${report.aiInsights.weaknesses.map(w => `• ${w}`).join('\n')}

RISK ASSESSMENT (${report.aiInsights.riskAssessment.score}/10):
${report.aiInsights.riskAssessment.factors.map(f => `• ${f}`).join('\n')}

RECOMMENDATIONS:
${report.aiInsights.riskAssessment.recommendations.map(r => `• ${r}`).join('\n')}

SUGGESTED PROTOCOLS:
${report.aiInsights.suggestedProtocols.map(p => 
  `• ${p.name} (${p.category}): ${p.description} - APY: ${p.apy}% - Risk: ${p.riskLevel}`
).join('\n')}

ACTION ITEMS:
${report.aiInsights.actionItems.map(a => 
  `• [${a.priority}] ${a.action} - ${a.reasoning}`
).join('\n')}

MARKET OUTLOOK:
${report.aiInsights.marketOutlook}

=== RECENT TRANSACTIONS ===
${report.transactionHistory.slice(0, 20).map(tx => 
  `${new Date(tx.timestamp).toLocaleDateString()} - ${tx.type}: ${tx.token.symbol} ($${tx.usdValue.toFixed(2)})`
).join('\n')}

Generated by 1nchPilot Portfolio Analytics
    `.trim();
  };

  // Chart data preparation functions
  const preparePortfolioDistributionData = (tokens: any[]) => {
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
    
    return tokens.slice(0, 8).map((token, index) => ({
      name: token.symbol,
      value: token.balanceUSD,
      percentage: token.percentage,
      color: COLORS[index % COLORS.length]
    }));
  };

  const preparePerformanceData = (tokens: any[]) => {
    const performanceData = tokens.slice(0, 10).map(token => ({
      symbol: token.symbol,
      value: token.balanceUSD,
      change24h: token.dayChangePercent || token.dayChange || Math.random() * 10 - 5, // Fallback with random data for demo
      roi: token.profitPercent || token.roi || 0
    }));
    
    return performanceData;
  };

  const prepareRiskMetricsData = (report: PortfolioReport) => {
    // Calculate meaningful risk metrics on a 0-10 scale
    const riskScore = report.aiInsights.riskAssessment.score;
    const diversificationScore = report.aiInsights.diversificationAnalysis?.score || 5;
    
    // Convert performance grade to numeric score
    const performanceScore = report.aiInsights.performanceAnalysis?.grade === 'A' ? 9 : 
                            report.aiInsights.performanceAnalysis?.grade === 'B' ? 7 :
                            report.aiInsights.performanceAnalysis?.grade === 'C' ? 5 : 3;
    
    // Convert volatility to risk score (higher volatility = higher risk)
    // Assume 0-20% volatility maps to 0-10 risk scale
    const volatilityRisk = Math.min(Math.max(report.metrics.volatility / 2, 0), 10);
    
    return [
      { metric: 'Overall Risk', value: riskScore, max: 10, description: 'Portfolio risk assessment' },
      { metric: 'Diversification', value: diversificationScore, max: 10, description: 'Asset spread quality' },
      { metric: 'Performance', value: performanceScore, max: 10, description: 'Historical returns' },
      { metric: 'Volatility Risk', value: volatilityRisk, max: 10, description: 'Price stability risk' }
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <BarChart3 className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Portfolio Analytics</h1>
            {onClose && (
              <button
                onClick={onClose}
                className="ml-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </motion.div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Generate comprehensive AI-powered portfolio analytics with insights, risk assessment, 
            and personalized recommendations based on your wallet activity.
          </p>
        </div>

        {/* Input Section */}
        {!report && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-xl p-8 mb-8 border border-gray-100"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate AI-Powered Portfolio Report</h2>
              <p className="text-gray-600">Enter your wallet address to get comprehensive analytics and insights</p>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Enter your wallet address (0x...)"
                  className="w-full px-6 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Blockchain Network
                </label>
                <select
                  value={chainId}
                  onChange={(e) => setChainId(Number(e.target.value))}
                  className="w-full px-6 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                >
                  <option value={1}>Ethereum Mainnet</option>
                  <option value={42161}>Arbitrum</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <h4 className="font-semibold text-blue-900 mb-3 text-lg">🤖 AI Models Available</h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span><strong>Google Gemini 2.0 Flash</strong> - Advanced analysis (Primary)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span><strong>OpenAI GPT-4o-mini</strong> - Comprehensive insights (Fallback)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span><strong>Demo Analytics</strong> - Basic analysis (Always available)</span>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-3 font-medium">
                  ✨ The system automatically selects the best available model for optimal results
                </p>
              </div>

              <button
                onClick={handleGenerateReport}
                disabled={loading || !walletAddress}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FileText className="w-6 h-6" />
                    Generate Analytics Report
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Report Display */}
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Report Header */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Portfolio Report</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-gray-600">
                      Generated on {new Date(report.generatedAt).toLocaleDateString()}
                    </p>
                    {aiModel && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        🔮 {aiModel}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={downloadReport}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF Report
                  </button>
                  <button
                    onClick={() => setReport(null)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Generate New Report
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-blue-600">
                    ${report.metrics.totalValue.toFixed(0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Value</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Wallet className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-600">
                    {report.metrics.tokenCount}
                  </p>
                  <p className="text-sm text-gray-600">Tokens</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  {report.metrics.netPnL >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-600 mx-auto mb-1" />
                  )}
                  <p className={`text-2xl font-bold ${report.metrics.netPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {report.metrics.netPnLPercent.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">Net P&L</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Activity className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-orange-600">
                    {report.metrics.volatility.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">Volatility</p>
                </div>
              </div>
            </div>

            {/* Portfolio Charts Section */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">📊 Portfolio Visualizations</h2>
              <p className="text-gray-600">Interactive charts showing your portfolio composition and performance</p>
            </div>

            {/* Portfolio Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Portfolio Distribution Pie Chart - Takes more space */}
              <div className="xl:col-span-2 bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <PieChart className="w-6 h-6 text-blue-600" />
                  Portfolio Distribution
                </h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={preparePortfolioDistributionData(report.tokenAnalytics)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }: any) => percentage > 5 ? `${name} ${percentage.toFixed(1)}%` : ''}
                        outerRadius={120}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {preparePortfolioDistributionData(report.tokenAnalytics).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any, name: any, props: any) => [
                          `$${value.toFixed(2)} (${props.payload.percentage.toFixed(1)}%)`, 
                          props.payload.name
                        ]}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
                        iconType="circle"
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Holdings Bar Chart */}
              <div className="xl:col-span-1 bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Top Holdings Value
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={preparePerformanceData(report.tokenAnalytics)} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="symbol" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: any) => [`$${value.toFixed(2)}`, 'Value']} />
                      <Bar dataKey="value" fill="#10B981" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Risk Metrics Dashboard */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-red-600" />
                  Risk Assessment Dashboard
                </h3>
                <div className="space-y-4">
                  {prepareRiskMetricsData(report).map((metric, index) => {
                    const riskLevel = metric.value <= 3 ? 'Low' : metric.value <= 6 ? 'Medium' : 'High';
                    const colorClass = metric.value <= 3 ? 'bg-green-500' : metric.value <= 6 ? 'bg-yellow-500' : 'bg-red-500';
                    const bgColorClass = metric.value <= 3 ? 'bg-green-50 border-green-200' : metric.value <= 6 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';
                    const textColorClass = metric.value <= 3 ? 'text-green-800' : metric.value <= 6 ? 'text-yellow-800' : 'text-red-800';
                    
                    return (
                      <div key={index} className={`p-4 rounded-lg border-2 ${bgColorClass}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-semibold ${textColorClass}`}>{metric.metric}</h4>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${textColorClass} bg-white`}>
                              {riskLevel}
                            </span>
                            <span className={`font-bold text-lg ${textColorClass}`}>
                              {metric.value.toFixed(1)}/10
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{metric.description}</p>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${colorClass} transition-all duration-500`}
                            style={{ width: `${(metric.value / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Overall Risk Summary */}
                <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Overall Portfolio Risk</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Conservative</span>
                        <span>Aggressive</span>
                      </div>
                      <div className="w-full bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 rounded-full h-4">
                        <div 
                          className="h-4 bg-gray-800 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(report.aiInsights.riskAssessment.score / 10) * 100}%`,
                            maxWidth: '100%'
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {report.aiInsights.riskAssessment.score.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">Risk Score</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 24h Performance Chart */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-purple-600" />
                  24h Performance
                </h3>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={preparePerformanceData(report.tokenAnalytics)} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="symbol" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        domain={['dataMin - 2', 'dataMax + 2']}
                        tickFormatter={(value) => `${value.toFixed(1)}%`}
                      />
                      <Tooltip 
                        formatter={(value: any) => [`${value.toFixed(2)}%`, '24h Change']} 
                        labelStyle={{ color: '#374151' }}
                      />
                      <Bar dataKey="change24h" fill="#8884d8" radius={[2, 2, 0, 0]}>
                        {preparePerformanceData(report.tokenAnalytics).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.change24h >= 0 ? '#10B981' : '#EF4444'} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* AI Performance Analysis Section */}
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    🔮 AI Performance Insights
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-gray-700">
                          <strong>Performance Summary:</strong> This chart shows the 24-hour price changes for your top holdings. 
                          Green bars indicate positive performance, while red bars show negative changes.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-gray-700">
                          <strong>Trend Analysis:</strong> {
                            (() => {
                              const positiveCount = preparePerformanceData(report.tokenAnalytics).filter(token => token.change24h >= 0).length;
                              const totalCount = preparePerformanceData(report.tokenAnalytics).length;
                              const positivePercentage = (positiveCount / totalCount) * 100;
                              
                              if (positivePercentage >= 70) {
                                return "Strong bullish momentum across your portfolio with most tokens showing gains.";
                              } else if (positivePercentage >= 50) {
                                return "Mixed market sentiment with balanced gains and losses in your holdings.";
                              } else if (positivePercentage >= 30) {
                                return "Bearish pressure detected with more tokens declining than advancing.";
                              } else {
                                return "Strong bearish trend affecting most of your portfolio holdings.";
                              }
                            })()
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-gray-700">
                          <strong>Risk Indicator:</strong> {
                            (() => {
                              const avgVolatility = preparePerformanceData(report.tokenAnalytics).reduce((sum, token) => sum + Math.abs(token.change24h), 0) / preparePerformanceData(report.tokenAnalytics).length;
                              
                              if (avgVolatility > 10) {
                                return "High volatility detected. Consider position sizing and risk management strategies.";
                              } else if (avgVolatility > 5) {
                                return "Moderate volatility levels. Monitor closely for trend continuation or reversal.";
                              } else {
                                return "Low volatility environment. Suitable for stable growth strategies.";
                              }
                            })()
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                AI Insights & Analysis
              </h3>
              
              <div className="mb-6">
                <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">
                  {report.aiInsights.portfolioSummary}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {report.aiInsights.strengths.map((strength, index) => (
                      <li key={index} className="text-sm text-gray-700 bg-green-50 p-2 rounded">
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-2">
                    {report.aiInsights.weaknesses.map((weakness, index) => (
                      <li key={index} className="text-sm text-gray-700 bg-yellow-50 p-2 rounded">
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Risk & Performance Analysis */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  Risk Assessment
                </h3>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Risk Score</span>
                    <span className="font-medium">{report.aiInsights.riskAssessment.score}/10</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        report.aiInsights.riskAssessment.score <= 3 ? 'bg-green-500' :
                        report.aiInsights.riskAssessment.score <= 6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(report.aiInsights.riskAssessment.score / 10) * 100}%` }}
                    />
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  {report.aiInsights.riskAssessment.factors.map((factor, index) => (
                    <li key={index}>• {factor}</li>
                  ))}
                </ul>
                {report.aiInsights.riskAssessment.explanation && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 italic">
                      {report.aiInsights.riskAssessment.explanation}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Performance Analysis
                </h3>
                <div className="mb-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${
                      report.aiInsights.performanceAnalysis.grade === 'A' ? 'text-green-600' :
                      report.aiInsights.performanceAnalysis.grade === 'B' ? 'text-blue-600' :
                      report.aiInsights.performanceAnalysis.grade === 'C' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {report.aiInsights.performanceAnalysis.grade}
                    </div>
                    <p className="text-sm text-gray-600">Performance Grade</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-6">
                  {report.aiInsights.performanceAnalysis.benchmarkComparison}
                </p>

                {/* AI Performance Analysis Section */}
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    🎯 AI Performance Insights
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-gray-700">
                          <strong>Grade Analysis:</strong> {
                            report.aiInsights.performanceAnalysis.grade === 'A' ? 
                            "Exceptional performance! Your portfolio is outperforming market benchmarks with strong risk-adjusted returns." :
                            report.aiInsights.performanceAnalysis.grade === 'B' ? 
                            "Good performance with solid returns. Consider optimizing allocation for enhanced growth potential." :
                            report.aiInsights.performanceAnalysis.grade === 'C' ? 
                            "Average performance. There's room for improvement through strategic rebalancing and diversification." :
                            "Below-average performance detected. Consider reviewing your investment strategy and risk management."
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-gray-700">
                          <strong>ROI Assessment:</strong> {
                            (() => {
                              const roi = report.metrics.netPnLPercent;
                              if (roi > 20) {
                                return "Excellent returns! Your portfolio shows strong growth momentum with superior performance.";
                              } else if (roi > 5) {
                                return "Positive returns indicate healthy portfolio growth. Monitor for continued upward trajectory.";
                              } else if (roi > -5) {
                                return "Modest performance with room for optimization. Consider diversifying into trending sectors.";
                              } else {
                                return "Negative returns require attention. Review strategy and consider risk reduction measures.";
                              }
                            })()
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-gray-700">
                          <strong>Strategy Recommendation:</strong> {
                            (() => {
                              const volatility = report.metrics.volatility;
                              const roi = report.metrics.netPnLPercent;
                              
                              if (roi > 10 && volatility < 15) {
                                return "Maintain current strategy while gradually scaling position sizes for optimal growth.";
                              } else if (roi > 0 && volatility > 20) {
                                return "Consider reducing exposure to high-volatility assets while preserving growth momentum.";
                              } else if (roi < 0) {
                                return "Implement stop-loss strategies and diversify into stable, yield-generating protocols.";
                              } else {
                                return "Balance growth and stability by adding blue-chip tokens and DeFi yield opportunities.";
                              }
                            })()
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Suggested Protocols */}
            {report.aiInsights.suggestedProtocols.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recommended Protocols & Opportunities
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {report.aiInsights.suggestedProtocols.map((protocol, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{protocol.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          protocol.riskLevel === 'LOW' ? 'bg-green-100 text-green-800' :
                          protocol.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {protocol.riskLevel}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{protocol.description}</p>
                      <div className="text-sm">
                        <span className="text-green-600 font-medium">{protocol.apy}% APY</span>
                        <span className="text-gray-500 ml-2">• TVL: ${(protocol.tvl / 1e9).toFixed(1)}B</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {report.aiInsights.actionItems.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recommended Actions
                </h3>
                <div className="space-y-3">
                  {report.aiInsights.actionItems.map((item, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 text-xs rounded ${
                          item.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                          item.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {item.priority}
                        </span>
                        <span className="font-medium text-gray-900">{item.action}</span>
                      </div>
                      <p className="text-sm text-gray-600">{item.reasoning}</p>
                      <p className="text-sm text-green-600 font-medium">
                        Expected Impact: {item.estimatedImpact}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Holdings */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Holdings</h3>
              <div className="space-y-3">
                {report.tokenAnalytics.slice(0, 10).map((token, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{token.symbol}</h4>
                      <p className="text-sm text-gray-600">{token.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${token.balanceUSD.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">{token.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Floating AI Chat Button - Only show when report is generated */}
        {report && (
          <>
            <button
              onClick={() => setShowAIChat(true)}
              className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 z-50 flex items-center gap-2"
            >
              <Lightbulb className="w-6 h-6" />
              <span className="hidden md:block font-medium">Ask AI</span>
            </button>

            {/* AI Chat Popup */}
            {showAIChat && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-xl shadow-2xl max-w-2xl w-full h-[80vh] flex flex-col overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <Lightbulb className="w-6 h-6" />
                      <h3 className="text-xl font-bold">Portfolio AI Assistant</h3>
                    </div>
                    <button
                      onClick={() => setShowAIChat(false)}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <p className="text-gray-600 mb-6">
                      Ask me anything about your portfolio! I can help with risk analysis, rebalancing strategies, 
                      token insights, and investment recommendations.
                    </p>

                    {/* Q&A History */}
                    {qaHistory.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Recent Conversations</h4>
                        <div className="space-y-3">
                          {qaHistory.slice(-3).reverse().map((qa, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                              <div className="font-medium text-gray-800 mb-2 flex items-start gap-2">
                                <span className="text-blue-600">Q:</span>
                                <span>{qa.question}</span>
                              </div>
                              <div className="text-gray-600 text-sm flex items-start gap-2">
                                <span className="text-green-600">A:</span>
                                <span className="whitespace-pre-wrap">{qa.answer}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Current AI Answer */}
                    {aiAnswer && (
                      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          🤖 AI Response
                        </h4>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{aiAnswer}</p>
                      </div>
                    )}

                    {/* Quick Question Suggestions - only show when no answer */}
                    {!aiAnswer && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Quick Questions</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <button
                            onClick={() => setAiQuestion("What are the main risks in my current portfolio?")}
                            className="text-left p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-colors text-sm text-gray-700"
                          >
                            💡 What are the main risks in my portfolio?
                          </button>
                          <button
                            onClick={() => setAiQuestion("Should I rebalance my portfolio allocation?")}
                            className="text-left p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-colors text-sm text-gray-700"
                          >
                            ⚖️ Should I rebalance my portfolio?
                          </button>
                          <button
                            onClick={() => setAiQuestion("Which tokens should I consider selling?")}
                            className="text-left p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-colors text-sm text-gray-700"
                          >
                            📈 Which tokens should I consider selling?
                          </button>
                          <button
                            onClick={() => setAiQuestion("What DeFi opportunities match my risk profile?")}
                            className="text-left p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-colors text-sm text-gray-700"
                          >
                            🔗 What DeFi opportunities suit me?
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fixed Footer - Question Input */}
                  <div className="border-t bg-gray-50 p-6 flex-shrink-0">
                    {/* Action buttons row */}
                    {(aiAnswer || qaHistory.length > 0) && (
                      <div className="flex justify-between items-center mb-4">
                        <button
                          onClick={() => {
                            setAiAnswer('');
                            setAiQuestion('');
                            setQaHistory([]);
                          }}
                          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Clear Chat
                        </button>
                        <span className="text-xs text-gray-400">
                          {qaHistory.length > 0 && `${qaHistory.length} conversation${qaHistory.length > 1 ? 's' : ''}`}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={aiQuestion}
                        onChange={(e) => setAiQuestion(e.target.value)}
                        placeholder="Ask me anything about your portfolio..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !aiLoading) {
                            handleAIQuestion();
                          }
                        }}
                      />
                      <button
                        onClick={handleAIQuestion}
                        disabled={aiLoading || !aiQuestion.trim()}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200"
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Thinking...
                          </>
                        ) : (
                          <>
                            <Lightbulb className="w-4 h-4" />
                            Ask AI
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
