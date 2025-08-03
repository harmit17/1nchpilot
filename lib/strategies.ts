// Strategy definitions and types
export interface StrategyToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  targetPercentage: number;
  color: string; // For UI visualization
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  riskLevel: 'Conservative' | 'Moderate' | 'Aggressive';
  expectedAPY: string;
  totalValueLocked?: string;
  tokens: StrategyToken[];
  benefits: string[];
  chains: number[]; // Supported chain IDs
  minInvestment: string; // In ETH
}

export interface InvestmentCalculation {
  totalInvestmentUSD: number;
  totalInvestmentETH: string;
  swaps: SwapAllocation[];
  estimatedGasUSD: number;
  priceImpact: number;
}

export interface SwapAllocation {
  fromToken: {
    address: string;
    symbol: string;
    amount: string;
    amountUSD: number;
  };
  toToken: {
    address: string;
    symbol: string;
    targetAmount: string;
    targetAmountUSD: number;
    percentage: number;
  };
  quote?: any; // 1inch quote response
}

// Pre-defined strategies
export const STRATEGIES: Strategy[] = [
  {
    id: 'defi-blue-chip',
    name: 'DeFi Blue Chip',
    description: 'Conservative mix of established DeFi protocols with proven track records and strong fundamentals.',
    riskLevel: 'Conservative',
    expectedAPY: '8-12%',
    totalValueLocked: '$2.4B',
    minInvestment: '0.1',
    chains: [1], // Ethereum mainnet only
    tokens: [
      {
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        targetPercentage: 40,
        color: '#627EEA'
      },
      {
        address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
        symbol: 'UNI',
        name: 'Uniswap',
        decimals: 18,
        targetPercentage: 30,
        color: '#FF007A'
      },
      {
        address: '0xA0b86991c6218b36c1d19D4a2e9eb0ce3606eb48', // USDC
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        targetPercentage: 30,
        color: '#2775CA'
      }
    ],
    benefits: [
      'Low volatility compared to individual tokens',
      'Exposure to DeFi ecosystem growth',
      'Automatic rebalancing maintains target allocation',
      'MEV protection via 1inch Fusion'
    ]
  },
  {
    id: 'layer2-scalers',
    name: 'Layer 2 Scalers',
    description: 'High-growth potential tokens from the Layer 2 ecosystem, available on Ethereum mainnet.',
    riskLevel: 'Aggressive',
    expectedAPY: '15-25%',
    totalValueLocked: '$890M',
    minInvestment: '0.05',
    chains: [1], // Ethereum mainnet only
    tokens: [
      {
        address: '0x912CE59144191C1204E64559FE8253a0e49E6548', // ARB on mainnet
        symbol: 'ARB',
        name: 'Arbitrum',
        decimals: 18,
        targetPercentage: 40,
        color: '#12AAFF'
      },
      {
        address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', // LINK token on mainnet
        symbol: 'LINK',
        name: 'Chainlink',
        decimals: 18,
        targetPercentage: 35,
        color: '#375BD2'
      },
      {
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH on mainnet
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        targetPercentage: 25,
        color: '#627EEA'
      }
    ],
    benefits: [
      'Exposure to Layer 2 ecosystem growth',
      'High potential returns from scaling adoption',
      'Diversified across multiple L2 solutions',
      'Lower fees on Arbitrum execution'
    ]
  },
  {
    id: 'stable-yield',
    name: 'Stable Yield',
    description: 'Conservative strategy focusing on stablecoins and yield-generating assets for steady returns.',
    riskLevel: 'Conservative',
    expectedAPY: '5-8%',
    totalValueLocked: '$1.8B',
    minInvestment: '0.01',
    chains: [1], // Ethereum mainnet only
    tokens: [
      {
        address: '0xA0b86991c6218b36c1d19D4a2e9eb0ce3606eb48', // USDC
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        targetPercentage: 50,
        color: '#2775CA'
      },
      {
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        decimals: 18,
        targetPercentage: 30,
        color: '#F5AC37'
      },
      {
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        targetPercentage: 20,
        color: '#009393'
      }
    ],
    benefits: [
      'Minimal price volatility',
      'Steady yield generation',
      'Perfect for risk-averse investors',
      'Great entry point for DeFi beginners'
    ]
  }
];

// Helper functions
export const getStrategyById = (id: string): Strategy | undefined => {
  return STRATEGIES.find(strategy => strategy.id === id);
};

export const getStrategiesForChain = (chainId: number): Strategy[] => {
  return STRATEGIES.filter(strategy => strategy.chains.includes(chainId));
};

export const getRiskColor = (risk: Strategy['riskLevel']): string => {
  switch (risk) {
    case 'Conservative': return 'text-green-600 bg-green-100';
    case 'Moderate': return 'text-yellow-600 bg-yellow-100';
    case 'Aggressive': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};
