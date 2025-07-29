import { formatUnits, parseUnits } from 'viem';
import { Token, TokenBalance, Portfolio } from '@/types';

// Format currency values
export const formatCurrency = (value: number, currency = 'USD'): string => {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B ${currency}`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M ${currency}`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K ${currency}`;
  }
  return `${value.toFixed(2)} ${currency}`;
};

// Format token amounts
export const formatTokenAmount = (
  amount: string,
  decimals: number,
  symbol: string,
  showSymbol = true
): string => {
  const formatted = formatUnits(BigInt(amount), decimals);
  const num = parseFloat(formatted);
  
  if (num === 0) return '0';
  if (num < 0.0001) return '< 0.0001';
  if (num < 1) return num.toFixed(4);
  if (num < 1000) return num.toFixed(2);
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  return `${(num / 1000000).toFixed(1)}M`;
};

// Format percentage
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

// Calculate portfolio drift
export const calculatePortfolioDrift = (
  currentPortfolio: Portfolio,
  targetAllocation: { [tokenAddress: string]: number }
): number => {
  let totalDrift = 0;
  
  currentPortfolio.tokens.forEach(token => {
    const targetPercentage = targetAllocation[token.token.address] || 0;
    const drift = Math.abs(token.percentage - targetPercentage);
    totalDrift += drift;
  });
  
  return totalDrift / 2; // Divide by 2 because we're counting both over and under allocations
};

// Get token by symbol
export const getTokenBySymbol = (tokens: Token[], symbol: string): Token | undefined => {
  return tokens.find(token => token.symbol.toUpperCase() === symbol.toUpperCase());
};

// Calculate rebalancing swaps
export const calculateRebalancingSwaps = (
  currentPortfolio: Portfolio,
  targetAllocation: { [tokenAddress: string]: number },
  totalValueUSD: number
): Array<{
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmountUSD: number;
  type: 'sell' | 'buy';
}> => {
  const swaps: Array<{
    fromToken: Token;
    toToken: Token;
    fromAmount: string;
    toAmountUSD: number;
    type: 'sell' | 'buy';
  }> = [];
  
  const sells: Array<{ token: Token; amountUSD: number }> = [];
  const buys: Array<{ token: Token; amountUSD: number }> = [];
  
  // Calculate what needs to be sold and bought
  currentPortfolio.tokens.forEach(token => {
    const targetPercentage = targetAllocation[token.token.address] || 0;
    const targetValueUSD = (totalValueUSD * targetPercentage) / 100;
    const currentValueUSD = token.balanceUSD;
    
    if (currentValueUSD > targetValueUSD) {
      // Need to sell
      const sellAmountUSD = currentValueUSD - targetValueUSD;
      sells.push({ token: token.token, amountUSD: sellAmountUSD });
    } else if (currentValueUSD < targetValueUSD) {
      // Need to buy
      const buyAmountUSD = targetValueUSD - currentValueUSD;
      buys.push({ token: token.token, amountUSD: buyAmountUSD });
    }
  });
  
  // Create swaps (sell everything to USDC, then buy from USDC)
  sells.forEach(sell => {
    swaps.push({
      fromToken: sell.token,
      toToken: { address: '0xA0b86a33E6441b8c4C8C0C0C0C0C0C0C0C0C0C0', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 1 },
      fromAmount: parseUnits(sell.amountUSD.toString(), sell.token.decimals).toString(),
      toAmountUSD: sell.amountUSD,
      type: 'sell',
    });
  });
  
  buys.forEach(buy => {
    swaps.push({
      fromToken: { address: '0xA0b86a33E6441b8c4C8C0C0C0C0C0C0C0C0C0C0', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 1 },
      toToken: buy.token,
      fromAmount: parseUnits(buy.amountUSD.toString(), 6).toString(),
      toAmountUSD: buy.amountUSD,
      type: 'buy',
    });
  });
  
  return swaps;
};

// Generate random colors for charts
export const generateChartColors = (count: number): string[] => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1',
    '#14B8A6', '#F43F5E', '#22C55E', '#EAB308', '#A855F7',
  ];
  
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
};

// Truncate address
export const truncateAddress = (address: string, length = 6): string => {
  if (!address) return '';
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

// Copy to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Sleep utility
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Validate address
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Get token logo URL
export const getTokenLogoUrl = (token: Token): string => {
  if (token.logoURI) return token.logoURI;
  
  // Fallback to CoinGecko API
  return `https://assets.coingecko.com/coins/images/1/small/bitcoin.png`;
};

// Calculate gas cost in USD
export const calculateGasCostUSD = (gasUsed: string, gasPrice: string, ethPriceUSD: number): number => {
  const gasUsedBigInt = BigInt(gasUsed);
  const gasPriceBigInt = BigInt(gasPrice);
  const totalGasWei = gasUsedBigInt * gasPriceBigInt;
  const totalGasEth = parseFloat(formatUnits(totalGasWei, 18));
  return totalGasEth * ethPriceUSD;
}; 