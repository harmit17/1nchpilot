// Token and Portfolio Types
export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chainId: number;
}

export interface TokenBalance {
  token: Token;
  balance: string;
  balanceUSD: number;
  percentage: number;
}

export interface Portfolio {
  totalValueUSD: number;
  tokens: TokenBalance[];
  lastUpdated: Date;
}

// Strategy Types
export interface Strategy {
  id: string;
  name: string;
  description?: string;
  targetAllocation: TokenAllocation[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  driftThreshold: number; // percentage
  autoRebalance: boolean;
}

export interface TokenAllocation {
  token: Token;
  targetPercentage: number;
}

export interface RebalancingPlan {
  currentPortfolio: Portfolio;
  targetPortfolio: Portfolio;
  swaps: Swap[];
  estimatedGasUSD: number;
  estimatedSlippage: number;
  totalValueAfterRebalance: number;
}

export interface Swap {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  fromAmountUSD: number;
  toAmountUSD: number;
  type: 'sell' | 'buy';
}

// 1inch API Types
export interface OneInchQuote {
  fromToken: Token;
  toToken: Token;
  fromTokenAmount: string;
  toTokenAmount: string;
  protocols: any[];
  gas: {
    gasCost: string;
    gasCostUSD: string;
  };
  estimatedGas: string;
  estimatedGasUSD: string;
  gasPrice: string;
  gasPriceUSD: string;
  blockNumber: number;
  validTo: number;
  value: string;
  data: string;
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gas: string;
    gasPrice: string;
  };
}

export interface OneInchOrder {
  orderHash: string;
  signature: string;
  order: {
    salt: string;
    maker: string;
    makerAsset: string;
    takerAsset: string;
    makerAmount: string;
    takerAmount: string;
    receiver: string;
    permit: string;
    interaction: string;
  };
}

export interface OneInchOrderStatus {
  orderHash: string;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  blockNumber?: number;
  transactionHash?: string;
  fillAmount?: string;
  fillAmountUSD?: number;
}

// User and Authentication Types
export interface User {
  id: string;
  address: string;
  strategies: Strategy[];
  preferences: UserPreferences;
  createdAt: Date;
  lastActive: Date;
}

export interface UserPreferences {
  defaultChainId: number;
  slippageTolerance: number;
  gasOptimization: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    rebalanceAlerts: boolean;
  };
}

// UI State Types
export interface AppState {
  user: User | null;
  currentPortfolio: Portfolio | null;
  selectedStrategy: Strategy | null;
  isLoading: boolean;
  error: string | null;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Chart and Analytics Types
export interface PortfolioChartData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface PortfolioHistory {
  date: Date;
  totalValue: number;
  allocations: { [tokenAddress: string]: number };
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Chain and Network Types
export interface Chain {
  id: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Constants
export const SUPPORTED_CHAINS: Chain[] = [
  {
    id: 42161, // Arbitrum One
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  {
    id: 10, // Optimism
    name: 'Optimism',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  {
    id: 1, // Ethereum Mainnet
    name: 'Ethereum',
    rpcUrl: 'https://mainnet.infura.io/v3/your-project-id',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
];

export const DEFAULT_STRATEGY_TEMPLATES = [
  {
    id: 'defi-blue-chips',
    name: 'DeFi Blue Chips',
    description: 'A balanced portfolio of established DeFi protocols',
    allocations: [
      { symbol: 'ETH', percentage: 40 },
      { symbol: 'LDO', percentage: 20 },
      { symbol: 'UNI', percentage: 20 },
      { symbol: 'USDC', percentage: 20 },
    ],
  },
  {
    id: 'l2-scalers',
    name: 'L2 Scalers',
    description: 'Focus on Layer 2 scaling solutions',
    allocations: [
      { symbol: 'ETH', percentage: 30 },
      { symbol: 'MATIC', percentage: 25 },
      { symbol: 'ARB', percentage: 25 },
      { symbol: 'OP', percentage: 20 },
    ],
  },
  {
    id: 'stable-yield',
    name: 'Stable Yield',
    description: 'Conservative portfolio focused on stablecoins and yield',
    allocations: [
      { symbol: 'USDC', percentage: 40 },
      { symbol: 'USDT', percentage: 30 },
      { symbol: 'DAI', percentage: 20 },
      { symbol: 'ETH', percentage: 10 },
    ],
  },
]; 