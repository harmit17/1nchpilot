import axios from 'axios';
import { Token, TokenBalance, Portfolio, OneInchQuote, OneInchOrder, OneInchOrderStatus } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_1INCH_API_URL || 'https://api.1inch.dev';
const API_KEY = process.env.NEXT_PUBLIC_1INCH_API_KEY;

class OneInchAPI {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = API_KEY || '';
    this.baseURL = API_BASE_URL;
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    try {
      console.log('calling 1inch api:', `${this.baseURL}${endpoint}`, params);
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
        params,
      });
      console.log('1inch API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('1inch API Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'API request failed');
    }
  }

  // Get wallet balances
  async getWalletBalances(chainId: number, address: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/v1.1/${chainId}/address/${address}/balances`);
      return response;
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
      return { tokens: [] };
    }
  }

  // Get token metadata
  async getTokenData(chainId: number, tokenAddress: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/v1.1/token-data/${chainId}`, {
        tokenAddress,
      });
      return response;
    } catch (error) {
      console.error('Error fetching token data:', error);
      return null;
    }
  }

  // Get price feeds
  async getPriceFeeds(chainId: number, tokens: string[]): Promise<any> {
    try {
      const response = await this.makeRequest(`/v1.1/price-feed/${chainId}`, {
        tokens: tokens.join(','),
      });
      return response;
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
      throw error;
    }
  }
}

export const oneInchAPI = new OneInchAPI(); 