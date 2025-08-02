import { NextRequest, NextResponse } from 'next/server';
import { oneInchAPI } from '@/lib/1inch-api';
import { portfolioAI } from '@/lib/ai-service';
import { geminiPortfolioAI } from '@/lib/gemini-ai-service';
import { demoPortfolioAI } from '@/lib/demo-ai-service';
import { PortfolioReport, ReportGenerationRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: ReportGenerationRequest = await request.json();
    const { 
      walletAddress, 
      chainId, 
      timeframe = '30d',
      includeTransactionHistory = true,
      includeAIInsights = true 
    } = body;

    // Validate input
    if (!walletAddress || !chainId) {
      return NextResponse.json(
        { error: 'Wallet address and chain ID are required' },
        { status: 400 }
      );
    }

    // Validate wallet address format (basic check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    console.log(`📊 Generating portfolio report for ${walletAddress} on chain ${chainId}`);

    // Fetch comprehensive portfolio data
    const portfolioData = await oneInchAPI.getComprehensivePortfolioData(chainId, walletAddress);
    
    // Generate AI insights if requested
    let aiInsights = null;
    if (includeAIInsights) {
      try {
        const aiInputData = {
          metrics: portfolioData.metrics,
          tokens: portfolioData.portfolio.tokens,
          transactions: portfolioData.transactions,
          profitLoss: Array.isArray(portfolioData.profitLoss) ? portfolioData.profitLoss : []
        };
        
        // Try Gemini first (primary), then OpenAI, then demo service
        try {
          if (process.env.GEMINI_API_KEY) {
            console.log('🔮 Using Gemini 2.0 Flash for AI insights...');
            aiInsights = await geminiPortfolioAI.generatePortfolioInsights(aiInputData);
            console.log('✅ Gemini insights generated successfully');
          } else {
            throw new Error('Gemini API key not configured');
          }
        } catch (geminiError) {
          console.log('⚠️ Gemini unavailable, trying OpenAI...');
          try {
            if (process.env.OPENAI_API_KEY) {
              aiInsights = await portfolioAI.generatePortfolioInsights(aiInputData);
              console.log('✅ OpenAI insights generated successfully');
            } else {
              throw new Error('OpenAI API key not configured');
            }
          } catch (openaiError) {
            console.log('⚠️ OpenAI unavailable, using demo AI service');
            aiInsights = await demoPortfolioAI.generatePortfolioInsights(aiInputData);
            console.log('✅ Demo AI insights generated successfully');
          }
        }
      } catch (error) {
        console.error('⚠️ All AI services failed, continuing without insights:', error);
      }
    }

    // Create chart data
    const chartData = {
      portfolioValueHistory: [
        {
          timestamp: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
          value: portfolioData.metrics.totalValue * 0.9 // Simulated historical value
        },
        {
          timestamp: Date.now() - (15 * 24 * 60 * 60 * 1000), // 15 days ago
          value: portfolioData.metrics.totalValue * 0.95
        },
        {
          timestamp: Date.now(),
          value: portfolioData.metrics.totalValue
        }
      ],
      tokenAllocation: portfolioData.portfolio.tokens.map(token => ({
        symbol: token.token.symbol,
        value: token.balanceUSD,
        percentage: token.percentage
      })),
      profitLossHistory: [
        {
          timestamp: Date.now() - (30 * 24 * 60 * 60 * 1000),
          profit: portfolioData.metrics.totalProfit * 0.7,
          loss: portfolioData.metrics.totalLoss * 0.7,
          net: portfolioData.metrics.netPnL * 0.7
        },
        {
          timestamp: Date.now(),
          profit: portfolioData.metrics.totalProfit,
          loss: portfolioData.metrics.totalLoss,
          net: portfolioData.metrics.netPnL
        }
      ]
    };

    // Build the complete report
    const report: PortfolioReport = {
      id: `report_${Date.now()}_${walletAddress.slice(-8)}`,
      walletAddress,
      chainId,
      generatedAt: Date.now(),
      metrics: {
        ...portfolioData.metrics,
        // Add explanation for each metric
        calculationExplanations: {
          totalValue: `Total portfolio value of $${portfolioData.metrics.totalValue.toFixed(2)} calculated using 1inch Portfolio API v4 'current_value' endpoint. This uses real-time USD values (abs_portfolio_usd) from the API, which aggregates current market prices across multiple exchanges.`,
          
          netPnL: `Net P&L of $${portfolioData.metrics.netPnL.toFixed(2)} (${portfolioData.metrics.netPnLPercent.toFixed(2)}%) calculated using 1inch Portfolio API v4 'profit_and_loss' endpoint. The ROI percentage comes directly from the API's 'roi' field, and absolute profit from 'abs_profit_usd' field, representing realized and unrealized gains/losses.`,
          
          volatility: `Volatility of ${portfolioData.metrics.volatility.toFixed(2)}% is estimated based on portfolio P&L fluctuations. This is calculated as: (|24h_change_percent| × 7) to approximate weekly volatility. Higher values indicate more price instability.`,
          
          tokenCount: `Portfolio contains ${portfolioData.metrics.tokenCount} tokens with non-zero balances. Only tokens with actual holdings (amount > 0) from the Portfolio API are counted to show active positions.`,
          
          riskScore: `Risk assessment considers multiple factors: Portfolio concentration (${portfolioData.metrics.tokenCount} tokens = ${portfolioData.metrics.tokenCount > 10 ? 'well diversified' : portfolioData.metrics.tokenCount > 5 ? 'moderately diversified' : 'concentrated'}), Total value exposure ($${portfolioData.metrics.totalValue.toFixed(2)} = ${portfolioData.metrics.totalValue > 100000 ? 'high value' : portfolioData.metrics.totalValue > 10000 ? 'medium value' : 'low value'}), and Performance volatility (${portfolioData.metrics.volatility.toFixed(2)}% = ${portfolioData.metrics.volatility > 20 ? 'high volatility' : portfolioData.metrics.volatility > 10 ? 'medium volatility' : 'low volatility'}). Score ranges from 1 (lowest risk) to 10 (highest risk).`
        }
      },
      tokenAnalytics: portfolioData.portfolio.tokens
        .filter(token => token.balanceUSD > 0) // Only include tokens with non-zero USD value
        .map(token => ({
          address: token.token.address,
          symbol: token.token.symbol,
          name: token.token.name,
          balance: parseFloat(token.balance) / (10 ** token.token.decimals),
          balanceUSD: token.balanceUSD,
          percentage: token.percentage,
          dayChange: 0, // Would need historical price data
          dayChangePercent: 0,
          weekChange: 0,
          monthChange: 0,
          profit: 0, // Would calculate from transaction history
          profitPercent: 0,
          avgBuyPrice: 0,
          currentPrice: token.balanceUSD / (parseFloat(token.balance) / (10 ** token.token.decimals)),
          priceHistory: [], // Would need historical data
          transactionCount: portfolioData.transactions.filter(tx => 
            tx.token.address.toLowerCase() === token.token.address.toLowerCase()
          ).length,
          firstBought: Date.now() - (30 * 24 * 60 * 60 * 1000), // Placeholder
          lastActivity: Date.now()
        })),
      transactionHistory: includeTransactionHistory ? portfolioData.transactions : [],
      aiInsights: aiInsights || {
        portfolioSummary: "AI insights not available",
        strengths: [],
        weaknesses: [],
        riskAssessment: { score: 5, factors: [], recommendations: [] },
        diversificationAnalysis: { score: 5, sectorBreakdown: [], recommendations: [] },
        chartData: {
          tokenAllocation: {
            type: 'pie',
            title: 'Token Allocation',
            data: []
          },
          performanceTrend: {
            type: 'line',
            title: 'Portfolio Performance',
            data: []
          },
          riskMetrics: {
            type: 'radar',
            title: 'Risk Assessment',
            data: []
          },
          transactionActivity: {
            type: 'bar',
            title: 'Monthly Transaction Volume',
            data: []
          }
        },
        performanceAnalysis: { grade: 'C' as const, benchmarkComparison: "", keyMetrics: [] },
        suggestedProtocols: [],
        tradingStrategies: [],
        marketOutlook: "",
        actionItems: []
      },
      chartData
    };

    console.log(`✅ Portfolio report generated successfully for ${walletAddress}`);
    console.log(`📊 Report metrics: ${report.metrics.tokenCount} tokens, $${report.metrics.totalValue.toFixed(2)} total value`);

    return NextResponse.json({ 
      success: true, 
      report,
      message: 'Portfolio report generated successfully' 
    });

  } catch (error: any) {
    console.error('❌ Error generating portfolio report:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate portfolio report',
        details: error.message,
        success: false 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Portfolio Analytics API',
    endpoints: {
      'POST /api/portfolio/analytics': 'Generate portfolio report',
    },
    version: '1.0.0'
  });
}
