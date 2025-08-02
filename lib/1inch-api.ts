import axios from 'axios';
import { Token, TokenBalance, Portfolio, OneInchQuote, OneInchOrder, OneInchOrderStatus, TransactionHistory, PortfolioMetrics } from '@/types';

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
      
      console.log('🔍 RAW API Response:', JSON.stringify(response, null, 2));
      
      if (response && typeof response === 'object') {
        const tokenCount = Object.keys(response).length;
        const nonZeroCount = Object.values(response).filter(balance => 
          balance !== '0' && balance !== '0.0' && parseFloat(balance as string) > 0
        ).length;
        
        console.log(`📊 API Response: ${tokenCount} total tokens, ${nonZeroCount} with non-zero balances`);
        
        // Log first few tokens for debugging
        const firstTokens = Object.entries(response).slice(0, 5);
        firstTokens.forEach(([address, balance]) => {
          console.log(`   Token ${address}: ${balance}`);
        });
        
        // Log all non-zero balances for debugging
        const nonZeroTokens = Object.entries(response).filter(([_, balance]) => 
          balance !== '0' && balance !== '0.0' && parseFloat(balance as string) > 0
        );
        console.log('🪙 Non-zero tokens:', nonZeroTokens);
      } else {
        console.log('❌ Invalid or empty response from balance API');
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
    return this.makeRequest(`/token/v1.2/${chainId}/custom/${tokenAddress}`);
  }

  // Get price feeds
  async getPriceFeeds(chainId: number, tokens: string[]): Promise<any> {
    try {
      console.log(`💲 Fetching price feeds for ${tokens.length} tokens...`);
      const response = await this.makeRequest(`/price/v1.2/${chainId}/prices`, {
        tokens: tokens.join(','),
      });
      console.log('💰 Price API Raw Response:', JSON.stringify(response, null, 2));
      return response;
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
   * OPTIMIZED METHOD: Get portfolio data using the 1inch Portfolio API v4.
   */
  async getPortfolioData(chainId: number, address: string): Promise<Portfolio> {
    try {
      console.log(`📊 Fetching portfolio data for chain ${chainId} and address ${address}`);
      
      // First, get portfolio details using Portfolio API v4
      const portfolioDetails = await this.getPortfolioDetails(chainId, address);
      console.log('📊 Portfolio details received:', portfolioDetails);
      
      if (!portfolioDetails || portfolioDetails.length === 0) {
        console.log('❌ No portfolio details received from Portfolio API');
        return { totalValueUSD: 0, tokens: [], lastUpdated: new Date() };
      }
      
      // Extract tokens with non-zero balances
      const tokensWithBalance = portfolioDetails.filter((token: any) => 
        token.amount > 0 || (token.amount_wei && parseFloat(token.amount_wei) > 0)
      );
      
      console.log(`🔍 Found ${tokensWithBalance.length} tokens with non-zero balances`);
      
      if (tokensWithBalance.length === 0) {
        console.log('💰 No tokens with balances found');
        return { totalValueUSD: 0, tokens: [], lastUpdated: new Date() };
      }
      
      // Calculate total value from portfolio details
      let totalValueUSD = 0;
      const tokens: TokenBalance[] = [];
      
      // Process tokens from portfolio details
      for (const portfolioToken of tokensWithBalance) {
        try {
          console.log(`🔍 Processing portfolio token:`, portfolioToken);
          
          // Extract token information from portfolio API
          const tokenAddress = portfolioToken.contract_address || portfolioToken.address;
          const tokenAmount = portfolioToken.amount || 0;
          const tokenValueUSD = portfolioToken.value_usd || 0;
          const tokenSymbol = portfolioToken.symbol || 'UNKNOWN';
          const tokenName = portfolioToken.name || 'Unknown Token';
          const tokenDecimals = portfolioToken.decimals || 18;
          
          // Only fetch additional metadata if we don't have enough info
          let tokenMetadata = {
            symbol: tokenSymbol,
            name: tokenName,
            decimals: tokenDecimals,
            logoURI: portfolioToken.logo_url || ''
          };
          
          // If we're missing critical data, fetch from token API
          if (!tokenSymbol || tokenSymbol === 'UNKNOWN') {
            try {
              console.log(`🪙 Fetching additional metadata for ${tokenAddress}`);
              const metadata = await this.getTokenData(chainId, tokenAddress);
              if (metadata) {
                tokenMetadata = {
                  symbol: metadata.symbol || tokenSymbol,
                  name: metadata.name || tokenName,
                  decimals: metadata.decimals || tokenDecimals,
                  logoURI: metadata.logoURI || portfolioToken.logo_url || ''
                };
              }
            } catch (error) {
              console.log(`❌ Failed to fetch metadata for ${tokenAddress}:`, error);
            }
          }
          
          const token: Token = {
            address: tokenAddress,
            symbol: tokenMetadata.symbol,
            name: tokenMetadata.name,
            decimals: tokenMetadata.decimals,
            logoURI: tokenMetadata.logoURI,
            chainId,
          };

          totalValueUSD += tokenValueUSD;

          tokens.push({
            token,
            balance: portfolioToken.amount_wei || tokenAmount.toString(),
            balanceUSD: tokenValueUSD,
            percentage: 0, // Will be calculated later
          });

          console.log(`✅ Processed ${token.symbol}: ${tokenAmount} tokens = $${tokenValueUSD.toFixed(2)}`);

        } catch (error) {
          console.error(`❌ Error processing token:`, error);
        }
      }

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

  /**
   * Fetch portfolio details from 1inch portfolio API (only tokens with amount > 0)
   */
  async getPortfolioDetails(chainId: number, address: string): Promise<any> {
    try {
      console.log(`📊 Fetching portfolio details for ${address} on chain ${chainId}`);
      const endpoint = `/portfolio/portfolio/v4/overview/erc20/details`;
      const params = {
        addresses: address,
        chain_id: chainId
      };
      const response = await this.makeRequest(endpoint, params);
      console.log('📊 Portfolio Details Raw Response:', JSON.stringify(response, null, 2));
      
      if (
        response &&
        typeof response === 'object' &&
        'result' in response &&
        Array.isArray((response as any).result)
      ) {
        const filteredResult = (response as any).result.filter((token: any) => token.amount > 0);
        console.log('🎯 Filtered portfolio details (amount > 0):', filteredResult);
        return filteredResult;
      }
      return [];
    } catch (error) {
      console.error('❌ Error fetching portfolio details:', error);
      return [];
    }
  }

  /**
   * Fetch current value of ERC20 tokens using Portfolio API v4
   */
  async getPortfolioCurrentValue(chainId: number, address: string): Promise<any> {
    try {
      console.log(`💰 Fetching current value for ${address} on chain ${chainId}`);
      const endpoint = `/portfolio/portfolio/v4/overview/erc20/current_value`;
      const params = {
        addresses: address,
        chain_id: chainId
      };
      const response = await this.makeRequest(endpoint, params);
      console.log('💰 Current Value Raw Response:', JSON.stringify(response, null, 2));
      
      if (
        response &&
        typeof response === 'object' &&
        'result' in response
      ) {
        console.log('✅ Current value result:', (response as any).result);
        return (response as any).result;
      }
      return [];
    } catch (error) {
      console.error('❌ Error fetching portfolio current value:', error);
      return [];
    }
  }

  /**
   * Fetch portfolio profit and loss data from 1inch API
   */
  async getPortfolioProfitLoss(chainId: number, address: string, fromTimestamp?: number, toTimestamp?: number): Promise<any> {
    try {
      console.log(`📈 Fetching profit/loss for ${address} on chain ${chainId}`);
      const endpoint = `/portfolio/portfolio/v4/overview/erc20/profit_and_loss`;
      const params: any = {
        addresses: address,
        chain_id: chainId
      };
      
      // Add optional time range parameters
      if (fromTimestamp) {
        params.from_timestamp = fromTimestamp;
      }
      if (toTimestamp) {
        params.to_timestamp = toTimestamp;
      }
      
      const response = await this.makeRequest(endpoint, params);
      console.log('📈 Profit/Loss Raw Response:', JSON.stringify(response, null, 2));
      
      if (
        response &&
        typeof response === 'object' &&
        'result' in response &&
        Array.isArray((response as any).result)
      ) {
        console.log('📊 Profit/Loss result:', (response as any).result);
        return (response as any).result;
      }
      return [];
    } catch (error) {
      console.error('❌ Error fetching portfolio profit/loss:', error);
      return [];
    }
  }

  /**
   * Fetch token metadata from 1inch API
   */
  async getTokenMetadata(chainId: number, tokenAddress: string): Promise<any> {
    try {
      const endpoint = `/token/v1.2/${chainId}/custom/${tokenAddress}`;
      const response = await this.makeRequest(endpoint, {});
      return response;
    } catch (error) {
      console.error('❌ Error fetching token metadata:', error);
      return null;
    }
  }

  /**
   * Fetch transaction history from 1inch History API
   */
  async getTransactionHistory(chainId: number, address: string, limit: number = 100): Promise<TransactionHistory[]> {
    try {
      console.log(`📜 Fetching transaction history for address ${address} on chain ${chainId}`);
      const endpoint = `/history/v2.0/history/${address}/events`;
      const params = {
        chainId: chainId,
        limit: limit
      };
      const response = await this.makeRequest(endpoint, params);
      
      if (response && typeof response === 'object' && 'items' in response && Array.isArray((response as any).items)) {
        return (response as any).items.map((tx: any) => ({
          hash: tx.txHash,
          timestamp: tx.timeMs,
          blockNumber: tx.blockNumber,
          from: tx.details?.fromAddress || address,
          to: tx.details?.toAddress || '',
          value: tx.details?.amount || '0',
          token: {
            address: tx.details?.tokenAddress || '',
            symbol: tx.details?.tokenSymbol || '',
            name: tx.details?.tokenName || '',
            decimals: tx.details?.tokenDecimals || 18
          },
          type: this.mapTransactionType(tx.type),
          usdValue: tx.details?.usdAmount || 0,
          gasUsed: tx.gasUsed || '0',
          gasPriceGwei: tx.gasPrice || '0'
        }));
      }
      return [];
    } catch (error) {
      console.error('❌ Error fetching transaction history:', error);
      return [];
    }
  }

  private mapTransactionType(type: string): TransactionHistory['type'] {
    switch (type?.toLowerCase()) {
      case 'swap':
      case 'trade':
        return 'SWAP';
      case 'transfer':
        return 'TRANSFER';
      case 'stake':
        return 'STAKE';
      case 'unstake':
        return 'UNSTAKE';
      case 'liquidity_add':
      case 'add_liquidity':
        return 'LIQUIDITY_ADD';
      case 'liquidity_remove':
      case 'remove_liquidity':
        return 'LIQUIDITY_REMOVE';
      default:
        return 'TRANSFER';
    }
  }

  /**
   * Calculate comprehensive portfolio metrics
   */
  async getPortfolioMetrics(chainId: number, address: string): Promise<PortfolioMetrics> {
    try {
      console.log(`📊 Calculating portfolio metrics for ${address}`);
      
      const [portfolio, profitLoss, transactions] = await Promise.all([
        this.getPortfolioData(chainId, address),
        this.getPortfolioProfitLoss(chainId, address),
        this.getTransactionHistory(chainId, address, 500)
      ]);

      // Calculate basic metrics
      const totalValue = portfolio.totalValueUSD;
      const tokenCount = portfolio.tokens.length;
      
      // Calculate P&L from API data
      let totalProfit = 0;
      let totalLoss = 0;
      
      profitLoss.forEach((item: any) => {
        if (item.profit > 0) totalProfit += item.profit;
        if (item.profit < 0) totalLoss += Math.abs(item.profit);
      });

      const netPnL = totalProfit - totalLoss;
      const netPnLPercent = totalValue > 0 ? (netPnL / (totalValue - netPnL)) * 100 : 0;

      // Calculate time-based metrics from transaction history
      const now = Date.now();
      const dayAgo = now - (24 * 60 * 60 * 1000);
      
      // Estimate 24h change (simplified calculation)
      const totalValueChange24h = netPnL * 0.1; // Rough estimate
      const totalValueChangePercent24h = totalValue > 0 ? (totalValueChange24h / totalValue) * 100 : 0;

      // Calculate other metrics (simplified for demo)
      const avgDailyReturn = netPnLPercent / 30; // Rough 30-day average
      const sharpeRatio = avgDailyReturn / Math.max(Math.abs(avgDailyReturn) * 0.5, 1); // Simplified
      const maxDrawdown = Math.min(netPnLPercent, -5); // Simplified
      const volatility = Math.abs(totalValueChangePercent24h) * 7; // Simplified weekly volatility

      return {
        totalValue,
        totalValueChange24h,
        totalValueChangePercent24h,
        tokenCount,
        totalProfit,
        totalLoss,
        netPnL,
        netPnLPercent,
        avgDailyReturn,
        sharpeRatio,
        maxDrawdown,
        volatility
      };
    } catch (error) {
      console.error('❌ Error calculating portfolio metrics:', error);
      // Return default metrics on error
      return {
        totalValue: 0,
        totalValueChange24h: 0,
        totalValueChangePercent24h: 0,
        tokenCount: 0,
        totalProfit: 0,
        totalLoss: 0,
        netPnL: 0,
        netPnLPercent: 0,
        avgDailyReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        volatility: 0
      };
    }
  }

  /**
   * Get comprehensive portfolio analytics including all data needed for AI analysis
   */
  async getComprehensivePortfolioData(chainId: number, address: string) {
    try {
      console.log(`🔍 Fetching comprehensive portfolio data for ${address}`);
      
      // Calculate time range for profit/loss (last 30 days)
      const toTimestamp = Math.floor(Date.now() / 1000);
      const fromTimestamp = toTimestamp - (30 * 24 * 60 * 60); // 30 days ago
      
      const [portfolio, currentValue, transactions, profitLoss] = await Promise.all([
        this.getPortfolioData(chainId, address),
        this.getPortfolioCurrentValue(chainId, address),
        this.getTransactionHistory(chainId, address, 1000),
        this.getPortfolioProfitLoss(chainId, address, fromTimestamp, toTimestamp)
      ]);

      // Calculate enhanced metrics using Portfolio API data
      const metrics = await this.calculatePortfolioMetricsFromAPI(currentValue, profitLoss, portfolio);

      return {
        portfolio,
        metrics,
        transactions,
        profitLoss,
        currentValue,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Error fetching comprehensive portfolio data:', error);
      throw error;
    }
  }

  /**
   * Calculate portfolio metrics using Portfolio API v4 data
   */
  private async calculatePortfolioMetricsFromAPI(currentValue: any, profitLoss: any[], portfolio: any): Promise<PortfolioMetrics> {
    try {
      console.log('📊 Calculating metrics from Portfolio API v4 data...');
      console.log('💰 Current Value Data:', currentValue);
      console.log('📈 Profit/Loss Data:', profitLoss);
      
      // Extract metrics from Portfolio API v4 responses
      const totalValue = currentValue?.abs_portfolio_usd || portfolio.totalValueUSD || 0;
      const tokenCount = portfolio.tokens?.length || 0;
      
      console.log(`💰 Total Portfolio Value: $${totalValue}`);
      console.log(`🪙 Token Count: ${tokenCount}`);
      
      // Calculate P&L from API data
      let totalProfit = 0;
      let totalLoss = 0;
      let netPnL = 0;
      let roi = 0;
      
      if (Array.isArray(profitLoss) && profitLoss.length > 0) {
        console.log('📈 Processing profit/loss data...');
        
        // Use the portfolio-level data if available
        const portfolioData = profitLoss[0] || {};
        
        // Extract ROI and absolute profit
        roi = portfolioData.roi || 0;
        const absoluteProfit = portfolioData.abs_profit_usd || 0;
        
        console.log(`📊 ROI: ${roi}%`);
        console.log(`💵 Absolute Profit: $${absoluteProfit}`);
        
        netPnL = absoluteProfit;
        if (absoluteProfit > 0) {
          totalProfit = absoluteProfit;
        } else {
          totalLoss = Math.abs(absoluteProfit);
        }
        
        // Also process individual token P&L if available
        profitLoss.forEach((item: any) => {
          if (item.abs_profit_usd !== undefined) {
            const pnl = item.abs_profit_usd;
            if (pnl > 0) totalProfit += pnl;
            if (pnl < 0) totalLoss += Math.abs(pnl);
          }
        });
      }

      const netPnLPercent = roi || 0; // Use ROI directly from API
      
      console.log(`📊 Final Metrics:`);
      console.log(`   Net P&L: $${netPnL.toFixed(2)} (${netPnLPercent.toFixed(2)}%)`);
      console.log(`   Total Profit: $${totalProfit.toFixed(2)}`);
      console.log(`   Total Loss: $${totalLoss.toFixed(2)}`);

      // Estimate other metrics (simplified calculations)
      const totalValueChange24h = netPnL * 0.1; // Rough estimate
      const totalValueChangePercent24h = totalValue > 0 ? (totalValueChange24h / totalValue) * 100 : 0;
      const avgDailyReturn = netPnLPercent / 30; // Rough 30-day average
      const sharpeRatio = avgDailyReturn / Math.max(Math.abs(avgDailyReturn) * 0.5, 1); // Simplified
      const maxDrawdown = Math.min(netPnLPercent, -5); // Simplified
      const volatility = Math.abs(totalValueChangePercent24h) * 7; // Simplified weekly volatility

      return {
        totalValue,
        totalValueChange24h,
        totalValueChangePercent24h,
        tokenCount,
        totalProfit,
        totalLoss,
        netPnL,
        netPnLPercent,
        avgDailyReturn,
        sharpeRatio,
        maxDrawdown,
        volatility
      };
    } catch (error) {
      console.error('❌ Error calculating portfolio metrics from API:', error);
      // Return default metrics on error
      return {
        totalValue: 0,
        totalValueChange24h: 0,
        totalValueChangePercent24h: 0,
        tokenCount: 0,
        totalProfit: 0,
        totalLoss: 0,
        netPnL: 0,
        netPnLPercent: 0,
        avgDailyReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        volatility: 0
      };
    }
  }
}

export const oneInchAPI = new OneInchAPI();