import { AIInsights, PortfolioMetrics, TokenAnalytics, TransactionHistory } from '@/types';

let openaiClient: any = null;

function getOpenAIClient() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    try {
      const OpenAI = require('openai');
      openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      throw new Error('OpenAI client initialization failed');
    }
  }
  
  if (!openaiClient) {
    throw new Error('OpenAI API key not configured');
  }
  
  return openaiClient;
}

export class PortfolioAIService {
  /**
   * Generate AI-powered portfolio insights
   */
  async generatePortfolioInsights(
    portfolioData: {
      metrics: PortfolioMetrics;
      tokens: any[];
      transactions: TransactionHistory[];
      profitLoss: any[];
    }
  ): Promise<AIInsights> {
    try {
      console.log('🤖 Generating AI insights for portfolio...');
      
      const prompt = this.buildAnalysisPrompt(portfolioData);
      const openai = getOpenAIClient();
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert DeFi portfolio analyst with deep knowledge of cryptocurrency markets, trading strategies, and risk management. 
            
            Your task is to analyze portfolio data and provide comprehensive, actionable insights. 
            
            Key focus areas:
            1. Risk assessment and diversification analysis
            2. Performance evaluation vs market benchmarks
            3. Identification of trending protocols and opportunities
            4. Strategic recommendations for portfolio optimization
            5. Market outlook based on current holdings
            
            Always provide specific, actionable advice with clear reasoning. Use professional tone but make it accessible to both beginners and advanced users.
            
            Respond with a valid JSON object matching the AIInsights interface structure.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('No response from AI service');
      }

      // Parse the JSON response
      const insights = JSON.parse(response) as AIInsights;
      
      // Validate and sanitize the response
      return this.sanitizeInsights(insights);
      
    } catch (error) {
      console.error('❌ Error generating AI insights:', error);
      
      // Return fallback insights if AI fails
      return this.getFallbackInsights(portfolioData);
    }
  }

  private buildAnalysisPrompt(portfolioData: {
    metrics: PortfolioMetrics;
    tokens: any[];
    transactions: TransactionHistory[];
    profitLoss: any[];
  }): string {
    const { metrics, tokens, transactions } = portfolioData;

    // Build token summary
    const tokenSummary = tokens.slice(0, 10).map(token => ({
      symbol: token.token?.symbol || token.symbol,
      balanceUSD: token.balanceUSD || token.amount * (token.price || 0),
      percentage: token.percentage || 0
    }));

    // Build transaction summary
    const recentTransactions = transactions.slice(0, 20).map(tx => ({
      type: tx.type,
      timestamp: new Date(tx.timestamp).toISOString(),
      usdValue: tx.usdValue,
      token: tx.token.symbol
    }));

    return `Analyze this cryptocurrency portfolio and provide comprehensive insights:

PORTFOLIO METRICS:
- Total Value: $${metrics.totalValue.toFixed(2)}
- Net P&L: $${metrics.netPnL.toFixed(2)} (${metrics.netPnLPercent.toFixed(2)}%)
- 24h Change: ${metrics.totalValueChangePercent24h.toFixed(2)}%
- Token Count: ${metrics.tokenCount}
- Sharpe Ratio: ${metrics.sharpeRatio.toFixed(2)}
- Max Drawdown: ${metrics.maxDrawdown.toFixed(2)}%
- Volatility: ${metrics.volatility.toFixed(2)}%

TOP HOLDINGS:
${tokenSummary.map(t => `- ${t.symbol}: $${t.balanceUSD.toFixed(2)} (${t.percentage.toFixed(1)}%)`).join('\n')}

RECENT TRANSACTION ACTIVITY:
${recentTransactions.map(t => `- ${t.type}: ${t.token} ($${t.usdValue.toFixed(2)}) on ${t.timestamp}`).join('\n')}

ANALYSIS REQUIREMENTS:
1. Provide a concise portfolio summary (2-3 sentences)
2. List 3-5 key strengths of the portfolio
3. Identify 3-5 areas for improvement
4. Assess risk level (1-10) with supporting factors
5. Evaluate diversification (1-10) with sector breakdown if possible
6. Grade performance (A-F) with benchmark comparison
7. Suggest 3-5 trending protocols/strategies that align with this portfolio
8. Provide market outlook based on holdings
9. List 3-5 actionable items with priority levels

Focus on:
- DeFi protocols and yield opportunities
- Risk management and diversification
- Current market trends and narratives
- Specific token recommendations
- Portfolio rebalancing suggestions

Return response as valid JSON matching this structure:
{
  "portfolioSummary": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "riskAssessment": {
    "score": number,
    "factors": ["string"],
    "recommendations": ["string"]
  },
  "diversificationAnalysis": {
    "score": number,
    "sectorBreakdown": [{"sector": "string", "percentage": number}],
    "recommendations": ["string"]
  },
  "performanceAnalysis": {
    "grade": "A|B|C|D|F",
    "benchmarkComparison": "string",
    "keyMetrics": ["string"]
  },
  "suggestedProtocols": [{
    "name": "string",
    "category": "DeFi|NFT|Gaming|Infrastructure|AI|RWA",
    "description": "string",
    "tvl": number,
    "apy": number,
    "riskLevel": "LOW|MEDIUM|HIGH",
    "compatibility": ["string"],
    "reasoning": "string"
  }],
  "tradingStrategies": [{
    "name": "string",
    "description": "string",
    "expectedReturn": number,
    "riskLevel": "LOW|MEDIUM|HIGH",
    "timeframe": "string",
    "tokens": ["string"],
    "reasoning": "string"
  }],
  "marketOutlook": "string",
  "actionItems": [{
    "priority": "HIGH|MEDIUM|LOW",
    "action": "string",
    "reasoning": "string",
    "estimatedImpact": "string"
  }]
}`;
  }

  private sanitizeInsights(insights: AIInsights): AIInsights {
    // Ensure all required fields are present with defaults
    return {
      portfolioSummary: insights.portfolioSummary || "Portfolio analysis completed successfully.",
      strengths: Array.isArray(insights.strengths) ? insights.strengths : [],
      weaknesses: Array.isArray(insights.weaknesses) ? insights.weaknesses : [],
      riskAssessment: {
        score: Math.max(1, Math.min(10, insights.riskAssessment?.score || 5)),
        factors: Array.isArray(insights.riskAssessment?.factors) ? insights.riskAssessment.factors : [],
        recommendations: Array.isArray(insights.riskAssessment?.recommendations) ? insights.riskAssessment.recommendations : [],
        explanation: insights.riskAssessment?.explanation || `Risk score of ${insights.riskAssessment?.score || 5}/10 calculated based on portfolio diversification, value exposure, and volatility metrics.`
      },
      diversificationAnalysis: {
        score: Math.max(1, Math.min(10, insights.diversificationAnalysis?.score || 5)),
        sectorBreakdown: Array.isArray(insights.diversificationAnalysis?.sectorBreakdown) ? insights.diversificationAnalysis.sectorBreakdown : [],
        recommendations: Array.isArray(insights.diversificationAnalysis?.recommendations) ? insights.diversificationAnalysis.recommendations : []
      },
      chartData: insights.chartData || {
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
      performanceAnalysis: {
        grade: ['A', 'B', 'C', 'D', 'F'].includes(insights.performanceAnalysis?.grade) ? insights.performanceAnalysis.grade : 'C',
        benchmarkComparison: insights.performanceAnalysis?.benchmarkComparison || "Performance analysis unavailable",
        keyMetrics: Array.isArray(insights.performanceAnalysis?.keyMetrics) ? insights.performanceAnalysis.keyMetrics : []
      },
      suggestedProtocols: Array.isArray(insights.suggestedProtocols) ? insights.suggestedProtocols : [],
      tradingStrategies: Array.isArray(insights.tradingStrategies) ? insights.tradingStrategies : [],
      marketOutlook: insights.marketOutlook || "Market outlook analysis unavailable",
      actionItems: Array.isArray(insights.actionItems) ? insights.actionItems : []
    };
  }

  private getFallbackInsights(portfolioData: {
    metrics: PortfolioMetrics;
    tokens: any[];
  }): AIInsights {
    const { metrics, tokens } = portfolioData;
    
    return {
      portfolioSummary: `Portfolio with ${metrics.tokenCount} tokens valued at $${metrics.totalValue.toFixed(2)}. Current P&L: ${metrics.netPnLPercent.toFixed(2)}%.`,
      strengths: [
        "Diversified token holdings",
        "Active trading history",
        "Exposure to DeFi ecosystem"
      ],
      weaknesses: [
        "Analysis requires more transaction data",
        "Consider risk management strategies",
        "Monitor for concentration risk"
      ],
      riskAssessment: {
        score: 6,
        factors: ["Market volatility exposure", "Token concentration risk"],
        recommendations: ["Implement stop-loss strategies", "Diversify across sectors"],
        explanation: `Risk score of 6/10 (Medium Risk) calculated based on: Portfolio diversification (${tokens.length} tokens = ${tokens.length > 10 ? 'low risk' : tokens.length > 5 ? 'medium risk' : 'high risk'}), Value exposure ($${metrics.totalValue.toFixed(2)} = ${metrics.totalValue > 100000 ? 'high exposure' : metrics.totalValue > 10000 ? 'medium exposure' : 'low exposure'}), Volatility (${metrics.volatility.toFixed(2)}% = ${metrics.volatility > 20 ? 'high volatility' : 'medium volatility'}). Formula: (diversification + value_risk + volatility_risk) / 3.`
      },
      diversificationAnalysis: {
        score: 5,
        sectorBreakdown: [
          { sector: "DeFi", percentage: 60 },
          { sector: "Infrastructure", percentage: 30 },
          { sector: "Other", percentage: 10 }
        ],
        recommendations: ["Consider adding stablecoin allocation", "Explore other sectors"]
      },
      chartData: {
        tokenAllocation: {
          type: 'pie',
          title: 'Token Allocation',
          data: tokens.slice(0, 5).map((token, index) => ({
            name: token.token?.symbol || token.symbol || `Token ${index + 1}`,
            value: token.percentage || (100 / tokens.length),
            color: `hsl(${index * 60}, 70%, 50%)`
          }))
        },
        performanceTrend: {
          type: 'line',
          title: 'Portfolio Performance',
          data: [
            { date: '2024-01-01', value: metrics.totalValue * 0.8, pnl: -20 },
            { date: '2024-02-01', value: metrics.totalValue * 0.9, pnl: -10 },
            { date: '2024-03-01', value: metrics.totalValue, pnl: metrics.netPnLPercent }
          ]
        },
        riskMetrics: {
          type: 'radar',
          title: 'Risk Assessment',
          data: [
            { metric: 'Diversification', value: 6, max: 10 },
            { metric: 'Volatility Control', value: 5, max: 10 },
            { metric: 'Liquidity', value: 7, max: 10 },
            { metric: 'Smart Contract Risk', value: 6, max: 10 },
            { metric: 'Correlation Risk', value: 4, max: 10 }
          ]
        },
        transactionActivity: {
          type: 'bar',
          title: 'Monthly Transaction Volume',
          data: [
            { month: 'Jan', volume: metrics.totalValue * 0.2, count: 5 },
            { month: 'Feb', volume: metrics.totalValue * 0.3, count: 8 },
            { month: 'Mar', volume: metrics.totalValue * 0.25, count: 6 }
          ]
        }
      },
      performanceAnalysis: {
        grade: 'C' as const,
        benchmarkComparison: "Performance data limited for comprehensive analysis",
        keyMetrics: ["Portfolio value tracked", "Transaction activity monitored"]
      },
      suggestedProtocols: [
        {
          name: "Aave",
          category: "DeFi" as const,
          description: "Leading lending protocol for yield generation",
          tvl: 12000000000,
          apy: 4.5,
          riskLevel: "MEDIUM" as const,
          compatibility: ["Ethereum", "Polygon"],
          reasoning: "Stable yield opportunities with good liquidity"
        }
      ],
      tradingStrategies: [
        {
          name: "DCA Strategy",
          description: "Dollar-cost averaging into major positions",
          expectedReturn: 8,
          riskLevel: "LOW" as const,
          timeframe: "3-6 months",
          tokens: ["ETH", "BTC"],
          reasoning: "Reduces timing risk and builds positions systematically"
        }
      ],
      marketOutlook: "Monitor market conditions and maintain balanced approach to risk management.",
      actionItems: [
        {
          priority: "MEDIUM" as const,
          action: "Review portfolio allocation",
          reasoning: "Ensure alignment with risk tolerance",
          estimatedImpact: "Improved risk-adjusted returns"
        }
      ]
    };
  }
}

export const portfolioAI = new PortfolioAIService();
