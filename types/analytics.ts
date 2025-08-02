// Analytics and Report Types
export interface TransactionHistory {
  hash: string;
  timestamp: number;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  token: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  type: 'SWAP' | 'TRANSFER' | 'STAKE' | 'UNSTAKE' | 'LIQUIDITY_ADD' | 'LIQUIDITY_REMOVE';
  usdValue: number;
  gasUsed: string;
  gasPriceGwei: string;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalValueChange24h: number;
  totalValueChangePercent24h: number;
  tokenCount: number;
  totalProfit: number;
  totalLoss: number;
  netPnL: number;
  netPnLPercent: number;
  avgDailyReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  calculationExplanations?: {
    totalValue: string;
    netPnL: string;
    volatility: string;
    tokenCount: string;
    riskScore: string;
  };
}

export interface TokenAnalytics {
  address: string;
  symbol: string;
  name: string;
  balance: number;
  balanceUSD: number;
  percentage: number;
  dayChange: number;
  dayChangePercent: number;
  weekChange: number;
  monthChange: number;
  profit: number;
  profitPercent: number;
  avgBuyPrice: number;
  currentPrice: number;
  priceHistory: Array<{
    timestamp: number;
    price: number;
  }>;
  transactionCount: number;
  firstBought: number;
  lastActivity: number;
}

export interface ProtocolInsight {
  name: string;
  category: 'DeFi' | 'NFT' | 'Gaming' | 'Infrastructure' | 'AI' | 'RWA';
  description: string;
  tvl: number;
  apy: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  compatibility: string[];
  reasoning: string;
}

export interface TradingStrategy {
  name: string;
  description: string;
  expectedReturn: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: string;
  tokens: string[];
  reasoning: string;
}

export interface AIInsights {
  portfolioSummary: string;
  strengths: string[];
  weaknesses: string[];
  riskAssessment: {
    score: number; // 1-10
    factors: string[];
    recommendations: string[];
    explanation?: string;
  };
  diversificationAnalysis: {
    score: number; // 1-10
    sectorBreakdown: Array<{
      sector: string;
      percentage: number;
    }>;
    recommendations: string[];
  };
  chartData: {
    tokenAllocation: {
      type: 'pie';
      title: string;
      data: Array<{
        name: string;
        value: number;
        color: string;
      }>;
    };
    performanceTrend: {
      type: 'line';
      title: string;
      data: Array<{
        date: string;
        value: number;
        pnl: number;
      }>;
    };
    riskMetrics: {
      type: 'radar';
      title: string;
      data: Array<{
        metric: string;
        value: number;
        max: number;
      }>;
    };
    transactionActivity: {
      type: 'bar';
      title: string;
      data: Array<{
        month: string;
        volume: number;
        count: number;
      }>;
    };
  };
  performanceAnalysis: {
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    benchmarkComparison: string;
    keyMetrics: string[];
  };
  suggestedProtocols: ProtocolInsight[];
  tradingStrategies: TradingStrategy[];
  marketOutlook: string;
  actionItems: Array<{
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    action: string;
    reasoning: string;
    estimatedImpact: string;
  }>;
}

export interface PortfolioReport {
  id: string;
  walletAddress: string;
  chainId: number;
  generatedAt: number;
  metrics: PortfolioMetrics;
  tokenAnalytics: TokenAnalytics[];
  transactionHistory: TransactionHistory[];
  aiInsights: AIInsights;
  chartData: {
    portfolioValueHistory: Array<{
      timestamp: number;
      value: number;
    }>;
    tokenAllocation: Array<{
      symbol: string;
      value: number;
      percentage: number;
    }>;
    profitLossHistory: Array<{
      timestamp: number;
      profit: number;
      loss: number;
      net: number;
    }>;
  };
}

export interface ReportGenerationRequest {
  walletAddress: string;
  chainId: number;
  timeframe?: '7d' | '30d' | '90d' | '1y' | 'all';
  includeTransactionHistory?: boolean;
  includeAIInsights?: boolean;
}

export interface ReportGenerationStatus {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  message: string;
  reportUrl?: string;
}
