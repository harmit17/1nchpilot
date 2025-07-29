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
      console.log('🚀 Calling 1inch API:', `${this.baseURL}${endpoint}`);
      console.log('📋 Parameters:', params);
      console.log('🔑 API Key:', this.apiKey ? 'Present' : 'Missing');
      
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
        params,
      });
      
      console.log('✅ 1inch API Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.error('❌ 1inch API Error:', error.response?.data || error.message);
      console.error('🔍 Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
      });
      throw new Error(error.response?.data?.message || 'API request failed');
    }
  }

  // Get wallet balances
  async getWalletBalances(chainId: number, address: string): Promise<any> {
    try {
      console.log(`💰 Fetching wallet balances for chain ${chainId} and address ${address}`);
      const response = await this.makeRequest(`/v1.1/${chainId}/address/${address}/balances`);
      console.log(`📊 Wallet balances response:`, JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('❌ Error fetching wallet balances:', error);
      return { tokens: [] };
    }
  }

  // Get token metadata
  async getTokenData(chainId: number, tokenAddress: string): Promise<any> {
    try {
      console.log(`🪙 Fetching token data for chain ${chainId} and token ${tokenAddress}`);
      const response = await this.makeRequest(`/v1.1/token-data/${chainId}`, {
        tokenAddress,
      });
      console.log(`📋 Token data response:`, JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('❌ Error fetching token data:', error);
      return null;
    }
  }

  // Get price feeds
  async getPriceFeeds(chainId: number, tokens: string[]): Promise<any> {
    try {
      console.log(`💲 Fetching price feeds for chain ${chainId} and tokens:`, tokens);
      const response = await this.makeRequest(`/v1.1/price-feed/${chainId}`, {
        tokens: tokens.join(','),
      });
      console.log(`📈 Price feeds response:`, JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('❌ Error fetching price feeds:', error);
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
      console.log(`📊 Fetching portfolio data for chain ${chainId} and address ${address}`);
      
      // Get wallet balances using 1inch API
      const balancesResponse = await this.getWalletBalances(chainId, address);
      const balances = balancesResponse.tokens || [];
      
      console.log(`🔍 Found ${balances.length} token balances`);
      
      if (balances.length === 0) {
        console.log(`⚠️ No token balances found for address ${address}`);
        return {
          totalValueUSD: 0,
          tokens: [],
          lastUpdated: new Date(),
        };
      }
      
      // Get token addresses for price feeds
      const tokenAddresses = balances.map((token: any) => token.address);
      console.log(`🪙 Token addresses for price lookup:`, tokenAddresses);
      
      // Get price feeds
      const pricesResponse = await this.getPriceFeeds(chainId, tokenAddresses);
      const prices = pricesResponse || {};
      
      // Get token metadata
      const tokenMetadata = await Promise.all(
        tokenAddresses.map(async (address: string) => {
          try {
            return await this.getTokenData(chainId, address);
          } catch (error) {
            console.warn(`⚠️ Failed to get metadata for token ${address}:`, error);
            return null;
          }
        })
      );

      // Process and combine data
      const tokens: TokenBalance[] = [];
      let totalValueUSD = 0;

      console.log(`🔄 Processing ${balances.length} tokens...`);

      balances.forEach((balance: any, index: number) => {
        const metadata = tokenMetadata[index];
        const price = prices[balance.address];
        
        console.log(`📝 Processing token ${index + 1}/${balances.length}:`, {
          address: balance.address,
          balance: balance.balance,
          hasMetadata: !!metadata,
          hasPrice: !!price,
        });
        
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
          
          console.log(`✅ Added token: ${metadata.symbol} - Balance: ${balance.balance}, Price: $${price}, Value: $${balanceUSD}`);
        } else {
          console.log(`❌ Skipped token ${balance.address} - Missing metadata or price`);
        }
      });

      // Calculate percentages
      if (totalValueUSD > 0) {
        tokens.forEach(token => {
          token.percentage = (token.balanceUSD / totalValueUSD) * 100;
        });
      }

      const portfolio = {
        totalValueUSD,
        tokens,
        lastUpdated: new Date(),
      };
      
      console.log(`🎉 Portfolio data complete:`, JSON.stringify(portfolio, null, 2));
      return portfolio;
    } catch (error) {
      console.error('❌ Error fetching portfolio data:', error);
      throw error;
    }
  }
}

export const oneInchAPI = new OneInchAPI(); 