import { AIInsights } from '@/types';

/**
 * Demo AI service that provides mock insights without requiring OpenAI API
 * This is useful for development and testing
 */
export class DemoPortfolioAIService {
  async generatePortfolioInsights(
    portfolioData: {
      metrics: any;
      tokens: any[];
      transactions: any[];
      profitLoss: any[];
    }
  ): Promise<AIInsights> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { metrics, tokens } = portfolioData;
    
    // Generate insights based on portfolio data
    const topTokens = tokens.slice(0, 5).map(t => t.token?.symbol || t.symbol || 'UNKNOWN');
    const totalValue = metrics.totalValue || 0;
    const tokenCount = metrics.tokenCount || tokens.length;
    const pnlPercent = metrics.netPnLPercent || 0;

    // Determine risk score based on portfolio composition
    const riskScore = this.calculateRiskScore(totalValue, tokenCount, pnlPercent);
    
    // Generate diversification score
    const diversificationScore = this.calculateDiversificationScore(tokens);

    // Determine performance grade
    const performanceGrade = this.getPerformanceGrade(pnlPercent);

    return {
      portfolioSummary: `This portfolio holds ${tokenCount} tokens with a total value of $${totalValue.toFixed(2)}. ${
        pnlPercent >= 0 
          ? `Currently showing a profit of ${pnlPercent.toFixed(2)}%, indicating positive performance.`
          : `Currently showing a loss of ${Math.abs(pnlPercent).toFixed(2)}%, suggesting room for optimization.`
      } The portfolio is ${tokenCount > 10 ? 'well-diversified' : tokenCount > 5 ? 'moderately diversified' : 'concentrated'} across ${tokenCount} different assets.`,

      strengths: this.generateStrengths(totalValue, tokenCount, pnlPercent, topTokens),
      weaknesses: this.generateWeaknesses(totalValue, tokenCount, pnlPercent, tokens),

      riskAssessment: {
        score: riskScore,
        factors: this.getRiskFactors(riskScore, tokenCount, totalValue),
        recommendations: this.getRiskRecommendations(riskScore),
        explanation: `The risk score of ${riskScore}/10 is calculated based on portfolio volatility, diversification, position concentration, and market conditions. A higher score indicates higher risk potential.`
      },

      diversificationAnalysis: {
        score: diversificationScore,
        sectorBreakdown: this.getSectorBreakdown(tokens),
        recommendations: this.getDiversificationRecommendations(diversificationScore)
      },

      chartData: {
        tokenAllocation: {
          type: 'pie',
          title: 'Token Allocation',
          data: topTokens.map((token, index) => ({
            name: token.symbol,
            value: token.percentage,
            color: `hsl(${index * 45}, 70%, 50%)`
          }))
        },
        performanceTrend: {
          type: 'line',
          title: 'Portfolio Performance',
          data: [
            { date: '2024-01-01', value: totalValue * 0.8, pnl: pnlPercent - 30 },
            { date: '2024-02-01', value: totalValue * 0.9, pnl: pnlPercent - 15 },
            { date: '2024-03-01', value: totalValue, pnl: pnlPercent }
          ]
        },
        riskMetrics: {
          type: 'radar',
          title: 'Risk Assessment',
          data: [
            { metric: 'Diversification', value: diversificationScore, max: 10 },
            { metric: 'Volatility Control', value: riskScore, max: 10 },
            { metric: 'Liquidity', value: Math.min(10, tokenCount), max: 10 },
            { metric: 'Smart Contract Risk', value: Math.max(1, 11 - riskScore), max: 10 },
            { metric: 'Correlation Risk', value: Math.max(1, diversificationScore - 2), max: 10 }
          ]
        },
        transactionActivity: {
          type: 'bar',
          title: 'Monthly Transaction Volume',
          data: [
            { month: 'Jan', volume: totalValue * 0.2, count: Math.floor(tokenCount * 0.8) },
            { month: 'Feb', volume: totalValue * 0.35, count: Math.floor(tokenCount * 1.2) },
            { month: 'Mar', volume: totalValue * 0.3, count: tokenCount }
          ]
        }
      },

      performanceAnalysis: {
        grade: performanceGrade,
        benchmarkComparison: `Portfolio ${pnlPercent >= 0 ? 'outperformed' : 'underperformed'} compared to typical DeFi portfolios. ${
          pnlPercent > 10 ? 'Excellent returns!' : 
          pnlPercent > 0 ? 'Solid performance.' : 
          pnlPercent > -10 ? 'Minor losses, recoverable.' : 
          'Significant losses, review strategy.'
        }`,
        keyMetrics: [
          `${pnlPercent.toFixed(2)}% total return`,
          `${tokenCount} token diversification`,
          `$${totalValue.toFixed(2)} portfolio value`,
          `Risk score: ${riskScore}/10`
        ]
      },

      suggestedProtocols: this.getSuggestedProtocols(),
      tradingStrategies: this.getTradingStrategies(pnlPercent, tokenCount),
      
      marketOutlook: this.getMarketOutlook(topTokens),
      
      actionItems: this.getActionItems(riskScore, diversificationScore, pnlPercent)
    };
  }

  private calculateRiskScore(totalValue: number, tokenCount: number, pnlPercent: number): number {
    let score = 5; // Base score
    
    // Adjust for diversification
    if (tokenCount > 20) score -= 1;
    else if (tokenCount < 5) score += 2;
    
    // Adjust for portfolio size
    if (totalValue > 100000) score -= 1;
    else if (totalValue < 1000) score += 1;
    
    // Adjust for performance
    if (pnlPercent < -20) score += 2;
    else if (pnlPercent > 20) score += 1;
    
    return Math.max(1, Math.min(10, score));
  }

  private calculateDiversificationScore(tokens: any[]): number {
    const tokenCount = tokens.length;
    if (tokenCount >= 20) return 9;
    if (tokenCount >= 15) return 8;
    if (tokenCount >= 10) return 7;
    if (tokenCount >= 7) return 6;
    if (tokenCount >= 5) return 5;
    if (tokenCount >= 3) return 4;
    return 3;
  }

  private getPerformanceGrade(pnlPercent: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (pnlPercent >= 20) return 'A';
    if (pnlPercent >= 10) return 'B';
    if (pnlPercent >= 0) return 'C';
    if (pnlPercent >= -20) return 'D';
    return 'F';
  }

  private generateStrengths(totalValue: number, tokenCount: number, pnlPercent: number, topTokens: string[]): string[] {
    const strengths = [];
    
    if (pnlPercent > 0) strengths.push("Portfolio showing positive returns");
    if (tokenCount >= 10) strengths.push("Well-diversified token holdings");
    if (totalValue > 10000) strengths.push("Substantial portfolio size for advanced strategies");
    if (topTokens.includes('ETH') || topTokens.includes('WETH')) strengths.push("Strong foundation with Ethereum exposure");
    if (topTokens.includes('USDC') || topTokens.includes('USDT')) strengths.push("Stable asset allocation for risk management");
    
    // Always include at least 2 strengths
    if (strengths.length < 2) {
      strengths.push("Active participation in DeFi ecosystem");
      strengths.push("Opportunity for portfolio optimization");
    }
    
    return strengths;
  }

  private generateWeaknesses(totalValue: number, tokenCount: number, pnlPercent: number, tokens: any[]): string[] {
    const weaknesses = [];
    
    if (pnlPercent < -10) weaknesses.push("Significant portfolio losses require strategy review");
    if (tokenCount < 5) weaknesses.push("Limited diversification increases concentration risk");
    if (totalValue < 1000) weaknesses.push("Small portfolio size limits advanced DeFi strategies");
    
    // Check for potential over-concentration
    const topToken = tokens[0];
    if (topToken && topToken.percentage > 50) {
      weaknesses.push("Over-concentration in single asset increases risk");
    }
    
    // Always include improvement areas
    if (weaknesses.length === 0) {
      weaknesses.push("Consider exploring additional yield opportunities");
    }
    
    return weaknesses;
  }

  private getRiskFactors(riskScore: number, tokenCount: number, totalValue: number): string[] {
    const factors = [];
    
    if (riskScore >= 7) factors.push("High portfolio volatility");
    if (tokenCount < 5) factors.push("Concentration risk from limited diversification");
    if (totalValue < 1000) factors.push("Small portfolio size vulnerability");
    
    factors.push("Market correlation risk");
    factors.push("Liquidity risk in DeFi protocols");
    
    return factors;
  }

  private getRiskRecommendations(riskScore: number): string[] {
    if (riskScore >= 7) {
      return [
        "Consider diversifying across more assets",
        "Implement stop-loss strategies",
        "Allocate portion to stablecoins"
      ];
    }
    
    return [
      "Maintain current risk management approach",
      "Monitor portfolio regularly",
      "Consider gradual position adjustments"
    ];
  }

  private getSectorBreakdown(tokens: any[]): Array<{ sector: string; percentage: number }> {
    // Simple sector estimation based on common tokens
    return [
      { sector: "DeFi", percentage: 60 },
      { sector: "Infrastructure", percentage: 25 },
      { sector: "Stablecoins", percentage: 10 },
      { sector: "Other", percentage: 5 }
    ];
  }

  private getDiversificationRecommendations(score: number): string[] {
    if (score < 6) {
      return [
        "Add more tokens to reduce concentration risk",
        "Consider exposure to different sectors",
        "Explore yield-bearing stablecoins"
      ];
    }
    
    return [
      "Maintain current diversification level",
      "Consider sector rotation opportunities",
      "Monitor correlation between holdings"
    ];
  }

  private getSuggestedProtocols(): any[] {
    return [
      {
        name: "Aave",
        category: "DeFi" as const,
        description: "Leading lending protocol for passive yield generation",
        tvl: 12000000000,
        apy: 4.2,
        riskLevel: "MEDIUM" as const,
        compatibility: ["Ethereum", "Polygon", "Arbitrum"],
        reasoning: "Stable yields with good security track record"
      },
      {
        name: "Uniswap V3",
        category: "DeFi" as const,
        description: "Concentrated liquidity provision for active yield",
        tvl: 8000000000,
        apy: 8.5,
        riskLevel: "HIGH" as const,
        compatibility: ["Ethereum", "Arbitrum"],
        reasoning: "Higher yields through active liquidity management"
      },
      {
        name: "Convex Finance",
        category: "DeFi" as const,
        description: "Boosted rewards for Curve LP tokens",
        tvl: 3000000000,
        apy: 6.8,
        riskLevel: "MEDIUM" as const,
        compatibility: ["Ethereum"],
        reasoning: "Enhanced Curve yields with CRV boosting"
      }
    ];
  }

  private getTradingStrategies(pnlPercent: number, tokenCount: number): any[] {
    const strategies = [];
    
    if (pnlPercent < -10) {
      strategies.push({
        name: "Recovery DCA Strategy",
        description: "Dollar-cost average into major positions to reduce average cost",
        expectedReturn: 12,
        riskLevel: "LOW" as const,
        timeframe: "3-6 months",
        tokens: ["ETH", "BTC"],
        reasoning: "Systematic buying reduces timing risk during recovery"
      });
    }
    
    strategies.push({
      name: "Yield Farming Rotation",
      description: "Rotate between high-yield protocols based on market conditions",
      expectedReturn: 15,
      riskLevel: "MEDIUM" as const,
      timeframe: "1-3 months",
      tokens: ["USDC", "ETH", "stablecoins"],
      reasoning: "Capitalize on changing yield opportunities across protocols"
    });
    
    if (tokenCount < 10) {
      strategies.push({
        name: "Diversification Strategy",
        description: "Gradually build positions across different DeFi sectors",
        expectedReturn: 10,
        riskLevel: "LOW" as const,
        timeframe: "6-12 months",
        tokens: ["Various blue-chip DeFi tokens"],
        reasoning: "Reduce risk through systematic diversification"
      });
    }
    
    return strategies;
  }

  private getMarketOutlook(topTokens: string[]): string {
    const hasEth = topTokens.some(token => ['ETH', 'WETH'].includes(token));
    const hasStables = topTokens.some(token => ['USDC', 'USDT', 'DAI'].includes(token));
    
    let outlook = "The DeFi market continues to evolve with new opportunities emerging. ";
    
    if (hasEth) {
      outlook += "Ethereum exposure positions the portfolio well for continued DeFi growth. ";
    }
    
    if (hasStables) {
      outlook += "Stablecoin allocation provides stability during market volatility. ";
    }
    
    outlook += "Focus on protocol fundamentals and sustainable yield opportunities while managing risk through diversification.";
    
    return outlook;
  }

  private getActionItems(riskScore: number, diversificationScore: number, pnlPercent: number): any[] {
    const items = [];
    
    if (riskScore >= 7) {
      items.push({
        priority: "HIGH" as const,
        action: "Implement risk management strategy",
        reasoning: "High risk score indicates need for immediate risk reduction",
        estimatedImpact: "Reduced portfolio volatility by 20-30%"
      });
    }
    
    if (diversificationScore < 6) {
      items.push({
        priority: "MEDIUM" as const,
        action: "Increase portfolio diversification",
        reasoning: "Limited diversification increases concentration risk",
        estimatedImpact: "Improved risk-adjusted returns"
      });
    }
    
    if (pnlPercent < -10) {
      items.push({
        priority: "HIGH" as const,
        action: "Review and adjust losing positions",
        reasoning: "Significant losses require strategy reassessment",
        estimatedImpact: "Portfolio recovery and improved performance"
      });
    }
    
    items.push({
      priority: "LOW" as const,
      action: "Explore yield farming opportunities",
      reasoning: "Passive income can enhance portfolio returns",
      estimatedImpact: "Additional 3-8% annual yield"
    });
    
    return items;
  }
}

export const demoPortfolioAI = new DemoPortfolioAIService();
