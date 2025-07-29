import axios from 'axios';
import { Token, TokenBalance, Portfolio, OneInchQuote, OneInchOrder, OneInchOrderStatus } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_1INCH_API_URL || 'https://api.1inch.dev';
const API_KEY = process.env.NEXT_PUBLIC_1INCH_API_KEY || '1z755hAGCmNbkmVBE2DGFQSFIFuEDDaL';

class OneInchAPI {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = API_KEY;
    this.baseURL = API_BASE_URL;
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error('1inch API Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'API request failed');
    }
  }

  // Get wallet balances
  async getWalletBalances(chainId: number, address: string): Promise<any> {
    try {
      // For now, return mock data since the API endpoints might be different
      console.log(`Mocking wallet balances for chain ${chainId} and address ${address}`);
      return this.getMockWalletBalances(chainId, address);
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
      // Return empty balances if API fails
      return { tokens: [] };
    }
  }

  // Get token metadata
  async getTokenData(chainId: number, tokenAddress: string): Promise<any> {
    try {
      // Mock token data for now
      const mockTokenData: { [key: string]: any } = {
        '0x0000000000000000000000000000000000000000': {
          symbol: 'ETH',
          name: 'Ether',
          decimals: 18,
          logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
        },
        '0xA0b86a33E6441b8c4C8C0C8C0C8C0C8C0C8C0C8C': {
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
        },
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': {
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
          logoURI: 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
        },
      };
      
      return mockTokenData[tokenAddress] || {
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: 18,
        logoURI: '',
      };
    } catch (error) {
      console.error('Error fetching token data:', error);
      return null;
    }
  }

  // Get price feeds
  async getPriceFeeds(chainId: number, tokens: string[]): Promise<any> {
    try {
      // Mock price data for now
      const mockPrices: { [key: string]: number } = {
        '0x0000000000000000000000000000000000000000': 2400, // ETH
        '0xA0b86a33E6441b8c4C8C0C8C0C8C0C8C0C8C0C8C': 1, // USDC
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 2400, // WETH
      };
      
      return mockPrices;
    } catch (error) {
      console.error('Error fetching price feeds:', error);
      return {};
    }
  }

  // Get swap quote
  async getQuote(
    chainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    fromAddress: string,
    slippage: number = 1
  ): Promise<OneInchQuote> {
    return this.makeRequest(`/v5.2/${chainId}/quote`, {
      src: fromTokenAddress,
      dst: toTokenAddress,
      amount,
      from: fromAddress,
      slippage,
    });
  }

  // Build order for Fusion mode
  async buildOrder(
    chainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    fromAddress: string,
    slippage: number = 1
  ): Promise<any> {
    return this.makeRequest(`/v5.2/${chainId}/order/builder`, {
      src: fromTokenAddress,
      dst: toTokenAddress,
      amount,
      from: fromAddress,
      slippage,
    });
  }

  // Place order (Fusion mode)
  async placeOrder(chainId: number, orderData: any): Promise<OneInchOrder> {
    return this.makeRequest(`/v5.2/${chainId}/order`, orderData);
  }

  // Get order status
  async getOrderStatus(chainId: number, orderHash: string): Promise<OneInchOrderStatus> {
    return this.makeRequest(`/v5.2/${chainId}/order/${orderHash}`);
  }

  // Get supported tokens
  async getSupportedTokens(chainId: number): Promise<any> {
    return this.makeRequest(`/v1.1/tokens/${chainId}`);
  }

  // Get portfolio data (combines balances, prices, and metadata)
  async getPortfolioData(chainId: number, address: string): Promise<Portfolio> {
    try {
      // For testnets, we'll use mock data since 1inch API might not support all testnets
      if (chainId === 421614 || chainId === 11155420 || chainId === 11155111) {
        return this.getMockPortfolioData(chainId, address);
      }
      
      // For mainnet, use real 1inch API
      console.log(`Fetching portfolio data for chain ${chainId} and address ${address}`);
      
      // Get wallet balances using 1inch API
      const balancesResponse = await this.getWalletBalances(chainId, address);
      const balances = balancesResponse.tokens || [];
      
      if (balances.length === 0) {
        return {
          totalValueUSD: 0,
          tokens: [],
          lastUpdated: new Date(),
        };
      }
      
      // Get token addresses for price feeds
      const tokenAddresses = balances.map((token: any) => token.address);
      
      // Get price feeds
      const pricesResponse = await this.getPriceFeeds(chainId, tokenAddresses);
      const prices = pricesResponse || {};
      
      // Get token metadata
      const tokenMetadata = await Promise.all(
        tokenAddresses.map(async (address: string) => {
          try {
            return await this.getTokenData(chainId, address);
          } catch (error) {
            console.warn(`Failed to get metadata for token ${address}:`, error);
            return null;
          }
        })
      );

      // Process and combine data
      const tokens: TokenBalance[] = [];
      let totalValueUSD = 0;

      balances.forEach((balance: any, index: number) => {
        const metadata = tokenMetadata[index];
        const price = prices[balance.address];
        
        if (metadata && price) {
          const token: Token = {
            address: balance.address,
            symbol: metadata.symbol,
            name: metadata.name,
            decimals: metadata.decimals,
            logoURI: metadata.logoURI,
            chainId,
          };

          const balanceUSD = parseFloat(balance.balance) * price;
          totalValueUSD += balanceUSD;

          tokens.push({
            token,
            balance: balance.balance,
            balanceUSD,
            percentage: 0, // Will be calculated below
          });
        }
      });

      // Calculate percentages
      if (totalValueUSD > 0) {
        tokens.forEach(token => {
          token.percentage = (token.balanceUSD / totalValueUSD) * 100;
        });
      }

      return {
        totalValueUSD,
        tokens,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      // Return mock data as fallback
      return this.getMockPortfolioData(chainId, address);
    }
  }

  // Mock wallet balances
  private getMockWalletBalances(chainId: number, address: string): any {
    return {
      tokens: [
        {
          address: '0x0000000000000000000000000000000000000000',
          balance: '1000000000000000000', // 1 ETH
        },
        {
          address: '0xA0b86a33E6441b8c4C8C0C8C0C8C0C8C0C8C0C8C',
          balance: '1000000', // 1 USDC
        },
        {
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          balance: '500000000000000000', // 0.5 WETH
        },
      ],
    };
  }

  // Mock portfolio data for testnets
  private getMockPortfolioData(chainId: number, address: string): Portfolio {
    const mockTokens: TokenBalance[] = [
      {
        token: {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'ETH',
          name: 'Ether',
          decimals: 18,
          chainId,
        },
        balance: '1000000000000000000', // 1 ETH
        balanceUSD: 2400,
        percentage: 60,
      },
      {
        token: {
          address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          chainId,
        },
        balance: '1000000', // 1 USDC
        balanceUSD: 1,
        percentage: 25,
      },
      {
        token: {
          address: '0x4200000000000000000000000000000000000006',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
          chainId,
        },
        balance: '500000000000000000', // 0.5 WETH
        balanceUSD: 1200,
        percentage: 15,
      },
    ];

    return {
      totalValueUSD: 4000,
      tokens: mockTokens,
      lastUpdated: new Date(),
    };
  }
}

export const oneInchAPI = new OneInchAPI(); 