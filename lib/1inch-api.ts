import axios from 'axios';
import { Token, TokenBalance, Portfolio, OneInchQuote, OneInchOrder, OneInchOrderStatus } from '@/types';

// --- Configuration for Rate Limiting ---
// The number of requests to send in a single parallel batch.
// 1inch has a rate limit of around 10 requests per second (RPS). A batch size of 5 is safe.
const BATCH_SIZE = 5; 
// The delay in milliseconds between each batch. 1000ms = 1 second.
// This ensures we stay under the RPS limit.
const DELAY_BETWEEN_BATCHES_MS = 1000;

const API_BASE_URL = process.env.NEXT_PUBLIC_1INCH_API_URL || 'https://1inch-vercel-proxy-gamma.vercel.app';
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
      const url = `${this.baseURL}${endpoint}`;
      console.log('🚀 Endpoint:', endpoint);
      console.log('🚀 Calling 1inch API via proxy:', url);
      
      // Convert params object to readable string for logging
      const paramsString = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      
      if (paramsString) {
        console.log('🚀 Query Parameters:', paramsString);
      } else {
        console.log('🚀 Query Parameters: None (using path parameters only)');
      }
      
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        params: params,
      });
      console.log('🚀 Response received successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ API request via proxy failed:', error.response?.data || error.message);
      console.error('🔍 Error Details:', {
        status: error.response?.status,
        url: error.config?.url,
      });
      throw new Error(error.response?.data?.message || 'API request failed');
    }
  }

  /**
   * NEW HELPER METHOD: Processes an array of items in batches to avoid rate limiting.
   * @param items - The array of items to process.
   * @param processFn - The async function to apply to each item.
   * @returns An array of Promise.allSettled results.
   */
  private async _processInBatches<T, R>(items: T[], processFn: (item: T) => Promise<R>): Promise<PromiseSettledResult<R>[]> {
    let allResults: PromiseSettledResult<R>[] = [];
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batchItems = items.slice(i, i + BATCH_SIZE);
        console.log(`🔄 Processing batch of ${batchItems.length} items (starting at index ${i})...`);
        
        const batchPromises = batchItems.map(processFn);
        const batchResults = await Promise.allSettled(batchPromises);
        
        allResults = allResults.concat(batchResults);

        if (i + BATCH_SIZE < items.length) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
        }
    }
    return allResults;
  }

  // Get wallet balances
  async getWalletBalances(chainId: number, address: string): Promise<any> {
    try {
      console.log(`💰 Fetching wallet balances for chain ${chainId} and address ${address}`);
      
      // Create the endpoint with path parameters
      const endpoint = `/balance/v1.2/${chainId}/balances/${address}`;
      
      // Log the parameters that are part of the URL path
      console.log(`🚀 Path Parameters: chainId=${chainId}, address=${address}`);
      
      const response = await this.makeRequest(endpoint);
      
      if (response && typeof response === 'object') {
        const tokenCount = Object.keys(response).length;
        const nonZeroCount = Object.values(response).filter(balance => 
          balance !== '0' && balance !== '0.0' && parseFloat(balance as string) > 0
        ).length;
        
        console.log(`📊 API Response: ${tokenCount} total tokens, ${nonZeroCount} with non-zero balances`);
        
        // Log first few tokens for debugging
        const firstTokens = Object.entries(response).slice(0, 3);
        firstTokens.forEach(([address, balance]) => {
          console.log(`   ${address}: ${balance}`);
        });
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error fetching wallet balances:', error);
      return {}; // Return an empty object on failure as per original structure
    }
  }

  // Get token metadata
  async getTokenData(chainId: number, tokenAddress: string): Promise<any> {
    // This function will now be called by the batch processor.
    // Errors will be caught by Promise.allSettled.
    return this.makeRequest(`/token/v1.2/${chainId}/tokens/${tokenAddress}`);
  }

  // Get price feeds
  async getPriceFeeds(chainId: number, tokens: string[]): Promise<any> {
    try {
      console.log(`💲 Fetching price feeds for ${tokens.length} tokens...`);
      return await this.makeRequest(`/price/v1.2/${chainId}/prices`, {
        tokens: tokens.join(','),
      });
    } catch (error) {
      console.error('❌ Error fetching price feeds:', error);
      return {};
    }
  }

  // --- Other methods remain unchanged ---
  async getQuote(chainId: number, fromTokenAddress: string, toTokenAddress: string, amount: string, fromAddress: string, slippage: number = 1): Promise<OneInchQuote> {
    return this.makeRequest(`/v5.2/${chainId}/quote`, { src: fromTokenAddress, dst: toTokenAddress, amount, from: fromAddress, slippage });
  }
  async buildOrder(chainId: number, fromTokenAddress: string, toTokenAddress: string, amount: string, fromAddress: string, slippage: number = 1): Promise<any> {
    return this.makeRequest(`/v5.2/${chainId}/order/builder`, { src: fromTokenAddress, dst: toTokenAddress, amount, from: fromAddress, slippage });
  }
  async placeOrder(chainId: number, orderData: any): Promise<OneInchOrder> {
    return this.makeRequest(`/v5.2/${chainId}/order`, orderData);
  }
  async getOrderStatus(chainId: number, orderHash: string): Promise<OneInchOrderStatus> {
    return this.makeRequest(`/v5.2/${chainId}/order/${orderHash}`);
  }
  async getSupportedTokens(chainId: number): Promise<any> {
    return this.makeRequest(`/token/v1.2/${chainId}/tokens`);
  }

  /**
   * OPTIMIZED METHOD: Get portfolio data using the 1inch balance API response format.
   */
  async getPortfolioData(chainId: number, address: string): Promise<Portfolio> {
    try {
      console.log(`📊 Fetching portfolio data for chain ${chainId} and address ${address}`);
      
      // Get balances from the API
      const balancesResponse = await this.getWalletBalances(chainId, address);
      
      if (!balancesResponse || typeof balancesResponse !== 'object') {
        console.log('❌ No balance data received from API');
        return { totalValueUSD: 0, tokens: [], lastUpdated: new Date() };
      }
      
      // Convert the response object to array of tokens with non-zero balances
      const balances = Object.entries(balancesResponse)
        .filter(([_, balance]) => balance !== '0' && balance !== '0.0' && parseFloat(balance as string) > 0)
        .map(([tokenAddress, balance]) => ({ 
          address: tokenAddress, 
          balance: balance as string 
        }));
      
      console.log(`🔍 Found ${balances.length} tokens with non-zero balances out of ${Object.keys(balancesResponse).length} total tokens`);
      
      if (balances.length === 0) {
        console.log('💰 No tokens with balances found');
        return { totalValueUSD: 0, tokens: [], lastUpdated: new Date() };
      }
      
      const tokenAddresses = balances.map(token => token.address);
      console.log(`💎 Token addresses with balances: ${tokenAddresses.slice(0, 5).join(', ')}${tokenAddresses.length > 5 ? '...' : ''}`);
      
      // Fetch prices for all tokens in a single efficient call
      console.log(`💲 Fetching price feeds for ${tokenAddresses.length} tokens...`);
      const prices = await this.getPriceFeeds(chainId, tokenAddresses) || {};
      
      // Fetch token metadata in controlled batches to avoid rate limiting
      console.log(`🪙 Fetching metadata for ${tokenAddresses.length} tokens in batches...`);
      const metadataResults = await this._processInBatches(tokenAddresses, (tokenAddress) => this.getTokenData(chainId, tokenAddress));

      // Process and combine data
      const tokens: TokenBalance[] = [];
      let totalValueUSD = 0;

      balances.forEach((balance, index) => {
        const metadataResult = metadataResults[index];
        const price = prices[balance.address];

        // Check if the metadata request was successful and we have a price
        if (metadataResult.status === 'fulfilled' && metadataResult.value && price) {
          const metadata = metadataResult.value;
          const token: Token = {
            address: balance.address,
            symbol: metadata.symbol || 'UNKNOWN',
            name: metadata.name || 'Unknown Token',
            decimals: metadata.decimals || 18,
            logoURI: metadata.logoURI || '',
            chainId,
          };

          const balanceInUnits = parseFloat(balance.balance) / (10 ** token.decimals);
          const balanceUSD = balanceInUnits * price;
          totalValueUSD += balanceUSD;

          tokens.push({
            token,
            balance: balance.balance, // Keep raw balance
            balanceUSD,
            percentage: 0, 
          });

          console.log(`✅ Processed ${token.symbol}: ${balanceInUnits.toFixed(4)} tokens = $${balanceUSD.toFixed(2)}`);

        } else {
            if (metadataResult.status === 'rejected') {
                console.log(`❌ Skipped token ${balance.address} - Metadata fetch failed:`, (metadataResult.reason as Error).message);
            } else {
                console.log(`❌ Skipped token ${balance.address} - Missing price data`);
            }
        }
      });

      // Calculate percentages
      if (totalValueUSD > 0) {
        tokens.forEach(token => {
          token.percentage = (token.balanceUSD / totalValueUSD) * 100;
        });
      }

      // Sort tokens by value (highest first)
      tokens.sort((a, b) => b.balanceUSD - a.balanceUSD);

      const portfolio = {
        totalValueUSD,
        tokens,
        lastUpdated: new Date(),
      };
      
      console.log(`🎉 Portfolio data complete!`);
      console.log(`💰 Total Value: $${totalValueUSD.toFixed(2)}`);
      console.log(`🪙 Token Count: ${tokens.length}`);
      console.log(`📊 Top tokens: ${tokens.slice(0, 3).map(t => `${t.token.symbol}: $${t.balanceUSD.toFixed(2)}`).join(', ')}`);
      
      return portfolio;
    } catch (error) {
      console.error('❌ A critical error occurred while fetching portfolio data:', error);
      throw error;
    }
  }
}

export const oneInchAPI = new OneInchAPI();