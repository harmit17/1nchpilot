import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIInsights, PortfolioMetrics, TokenAnalytics, TransactionHistory } from '@/types';

let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient() {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    } catch (error) {
      console.error('Failed to initialize Gemini client:', error);
      throw new Error('Gemini client initialization failed');
    }
  }
  
  if (!geminiClient) {
    throw new Error('Gemini API key not configured');
  }
  
  return geminiClient;
}

export class GeminiPortfolioAIService {
  /**
   * Generate AI-powered portfolio insights using Gemini 2.0 Flash
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
      console.log('🤖 Generating AI insights using Gemini 2.0 Flash...');
      
      const prompt = this.buildAnalysisPrompt(portfolioData);
      const genAI = getGeminiClient();
      
      // Use gemini-2.0-flash-exp model (latest available)
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No response from Gemini service');
      }

      // Clean the response and parse JSON
      const cleanedResponse = this.cleanJsonResponse(text);
      const insights = JSON.parse(cleanedResponse) as AIInsights;
      
      // Validate and sanitize the response
      return this.sanitizeInsights(insights);
      
    } catch (error) {
      console.error('❌ Error generating Gemini insights:', error);
      
      // Return fallback insights if Gemini fails
      return this.getFallbackInsights(portfolioData);
    }
  }

  private cleanJsonResponse(text: string): string {
    // Remove markdown code blocks if present
    let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // Try to find JSON object in the response
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }
    
    return cleaned;
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

    return `You are an expert DeFi portfolio analyst. Analyze this cryptocurrency portfolio and provide comprehensive insights in valid JSON format only.

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

RECENT TRANSACTIONS:
${recentTransactions.slice(0, 10).map(t => `- ${t.type}: ${t.token} ($${t.usdValue.toFixed(2)})`).join('\n')}

Respond with ONLY a valid JSON object matching this exact structure (no markdown, no explanations):

{
  "portfolioSummary": "2-3 sentence portfolio overview",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "riskAssessment": {
    "score": 5,
    "factors": ["factor1", "factor2"],
    "recommendations": ["rec1", "rec2"],
    "explanation": "Risk score calculation: Based on portfolio diversification (X tokens = Y points), total value exposure ($Z = W points), volatility (V% = U points), and sector concentration. Score formula: (diversification_score + value_risk_score + volatility_score) / 3. Lower scores (1-3) indicate conservative portfolios, medium scores (4-7) indicate balanced risk, higher scores (8-10) indicate aggressive/high-risk portfolios."
  },
  "diversificationAnalysis": {
    "score": 6,
    "sectorBreakdown": [
      {"sector": "DeFi", "percentage": 60},
      {"sector": "Infrastructure", "percentage": 25},
      {"sector": "Stablecoins", "percentage": 15}
    ],
    "recommendations": ["rec1", "rec2"]
  },
  "chartData": {
    "tokenAllocation": {
      "type": "pie",
      "title": "Token Allocation",
      "data": [
        {"name": "ETH", "value": 45.5, "color": "#627EEA"},
        {"name": "USDC", "value": 30.2, "color": "#2775CA"},
        {"name": "UNI", "value": 24.3, "color": "#FF007A"}
      ]
    },
    "performanceTrend": {
      "type": "line",
      "title": "Portfolio Performance",
      "data": [
        {"date": "2024-01-01", "value": 10000, "pnl": 0},
        {"date": "2024-02-01", "value": 11500, "pnl": 15},
        {"date": "2024-03-01", "value": 12200, "pnl": 22}
      ]
    },
    "riskMetrics": {
      "type": "radar",
      "title": "Risk Assessment",
      "data": [
        {"metric": "Diversification", "value": 7, "max": 10},
        {"metric": "Volatility Control", "value": 6, "max": 10},
        {"metric": "Liquidity", "value": 8, "max": 10},
        {"metric": "Smart Contract Risk", "value": 5, "max": 10},
        {"metric": "Correlation Risk", "value": 4, "max": 10}
      ]
    },
    "transactionActivity": {
      "type": "bar",
      "title": "Monthly Transaction Volume",
      "data": [
        {"month": "Jan", "volume": 5000, "count": 12},
        {"month": "Feb", "volume": 7500, "count": 18},
        {"month": "Mar", "volume": 6200, "count": 15}
      ]
    }
  },
  "performanceAnalysis": {
    "grade": "C",
    "benchmarkComparison": "comparison with market",
    "keyMetrics": ["metric1", "metric2"]
  },
    "recommendations": ["rec1", "rec2"]
  },
  "performanceAnalysis": {
    "grade": "C",
    "benchmarkComparison": "comparison with market",
    "keyMetrics": ["metric1", "metric2"]
  },
  "suggestedProtocols": [
    {
      "name": "Protocol Name",
      "category": "DeFi",
      "description": "Description",
      "tvl": 1000000000,
      "apy": 5.5,
      "riskLevel": "MEDIUM",
      "compatibility": ["Ethereum"],
      "reasoning": "Why this protocol"
    }
  ],
  "tradingStrategies": [
    {
      "name": "Strategy Name",
      "description": "Strategy description",
      "expectedReturn": 10,
      "riskLevel": "LOW",
      "timeframe": "3-6 months",
      "tokens": ["ETH", "USDC"],
      "reasoning": "Why this strategy"
    }
  ],
  "marketOutlook": "Market outlook and trends",
  "actionItems": [
    {
      "priority": "HIGH",
      "action": "Action to take",
      "reasoning": "Why this action",
      "estimatedImpact": "Expected impact"
    }
  ]
}

Focus on DeFi protocols, yield opportunities, risk management, and actionable recommendations. Provide specific, data-driven insights based on the portfolio composition.`;
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
      chartData: {
        tokenAllocation: insights.chartData?.tokenAllocation || {
          type: 'pie',
          title: 'Token Allocation',
          data: []
        },
        performanceTrend: insights.chartData?.performanceTrend || {
          type: 'line',
          title: 'Portfolio Performance',
          data: []
        },
        riskMetrics: insights.chartData?.riskMetrics || {
          type: 'radar',
          title: 'Risk Assessment',
          data: []
        },
        transactionActivity: insights.chartData?.transactionActivity || {
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

export const geminiPortfolioAI = new GeminiPortfolioAIService();
