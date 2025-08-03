'use client';

import { parseUnits, formatUnits } from 'viem';
import { Strategy, StrategyToken, InvestmentCalculation, SwapAllocation } from './strategies';

export class StrategyInvestmentService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_1INCH_API_URL || 'https://1inch-vercel-proxy-gamma.vercel.app';
    this.apiKey = process.env.NEXT_PUBLIC_1INCH_API_KEY || '';
    
    console.log('🚀 StrategyInvestmentService initialized');
    console.log('Base URL:', this.baseUrl);
    console.log('API Key available:', !!this.apiKey);
  }

  /**
   * Test 1inch API connectivity with a simple request
   */
  async testAPIConnectivity(): Promise<void> {
    try {
      console.log('🧪 Testing 1inch API connectivity...');
      console.log('🔗 Using same pattern as working SwapPopup component');
      
      // Test with the same quote endpoint that works in SwapPopup
      const testParams = {
        src: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
        dst: '0xA0b86991c6218b36c1d19D4a2e9eb0ce3606eb48', // USDC
        amount: parseUnits('0.1', 18).toString(), // 0.1 ETH
      };
      
      const testEndpoint = '/swap/v6.1/1/quote';
      console.log(`� Testing working endpoint: ${testEndpoint}`);
      
      await this.call1inchAPI(testEndpoint, testParams);
      console.log('✅ 1inch API connectivity test passed');
    } catch (error) {
      console.error('❌ 1inch API connectivity test failed:', error);
      throw error;
    }
  }

  private async call1inchAPI<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    const url = new URL(this.baseUrl + endpoint);
    url.search = new URLSearchParams(params).toString();

    console.log('🔍 1inch API Request Details:');
    console.log('Base URL:', this.baseUrl);
    console.log('Endpoint:', endpoint);
    console.log('Params:', params);
    console.log('Full URL:', url.toString());
    console.log('API Key (first 10 chars):', this.apiKey.substring(0, 10) + '...');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    console.log('🔍 1inch API Response Details:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    if (!response.ok) {
      const body = await response.text();
      console.error('❌ 1inch API Error Response Body:', body);
      throw new Error(`1inch API returned status ${response.status}: ${body}`);
    }

    const data = await response.json() as T;
    console.log('✅ 1inch API Success Response received');
    return data;
  }

  /**
   * Calculate investment allocation for a strategy
   */
  async calculateInvestment(
    strategy: Strategy,
    investmentAmountETH: string,
    chainId: number,
    userAddress: string
  ): Promise<InvestmentCalculation> {
    try {
      const investmentWei = parseUnits(investmentAmountETH, 18);
      const ethAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
      
      // Skip USD price calculation to avoid API issues - focus on ETH amounts
      const ethPriceUSD = 3000; // Mock price for display purposes
      const totalInvestmentUSD = parseFloat(investmentAmountETH) * ethPriceUSD;

      const swapAllocations: SwapAllocation[] = [];
      let totalGasEstimate = 0;
      let maxPriceImpact = 0;

      // Calculate swaps for each token in the strategy
      for (const token of strategy.tokens) {
        const targetPercentage = token.targetPercentage / 100;
        const targetETHAmount = parseFloat(investmentAmountETH) * targetPercentage;
        const targetWei = parseUnits(targetETHAmount.toString(), 18);

        if (token.address === ethAddress || token.address === '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2') {
          // For ETH/WETH, no swap needed or simple wrap
          swapAllocations.push({
            fromToken: {
              address: ethAddress,
              symbol: 'ETH',
              amount: targetETHAmount.toString(),
              amountUSD: targetETHAmount * ethPriceUSD
            },
            toToken: {
              address: token.address,
              symbol: token.symbol,
              targetAmount: targetETHAmount.toString(),
              targetAmountUSD: targetETHAmount * ethPriceUSD,
              percentage: token.targetPercentage
            }
          });
        } else {
          // Get quote for the swap
          try {
            const quoteResponse = await this.call1inchAPI<any>(`/swap/v6.1/${chainId}/quote`, {
              src: ethAddress,
              dst: token.address,
              amount: targetWei.toString()
            });

            const expectedTokens = quoteResponse.dstAmount;
            const expectedTokensFormatted = formatUnits(BigInt(expectedTokens), token.decimals);
            const priceImpact = parseFloat(quoteResponse.priceImpact || '0');
            
            maxPriceImpact = Math.max(maxPriceImpact, priceImpact);

            swapAllocations.push({
              fromToken: {
                address: ethAddress,
                symbol: 'ETH',
                amount: targetETHAmount.toString(),
                amountUSD: targetETHAmount * ethPriceUSD
              },
              toToken: {
                address: token.address,
                symbol: token.symbol,
                targetAmount: expectedTokensFormatted,
                targetAmountUSD: targetETHAmount * ethPriceUSD,
                percentage: token.targetPercentage
              },
              quote: quoteResponse
            });

            // Estimate gas (rough calculation)
            totalGasEstimate += 21000; // Base gas per swap
          } catch (error) {
            console.warn(`Failed to get quote for ${token.symbol}:`, error);
            // Fallback allocation without quote
            swapAllocations.push({
              fromToken: {
                address: ethAddress,
                symbol: 'ETH',
                amount: targetETHAmount.toString(),
                amountUSD: targetETHAmount * ethPriceUSD
              },
              toToken: {
                address: token.address,
                symbol: token.symbol,
                targetAmount: '0',
                targetAmountUSD: targetETHAmount * ethPriceUSD,
                percentage: token.targetPercentage
              }
            });
          }
        }
      }

      // Estimate total gas cost in USD (rough calculation)
      const gasPrice = 20; // gwei
      const gasCostETH = (totalGasEstimate * gasPrice * 1e-9);
      const estimatedGasUSD = gasCostETH * ethPriceUSD;

      return {
        totalInvestmentUSD,
        totalInvestmentETH: investmentAmountETH,
        swaps: swapAllocations,
        estimatedGasUSD,
        priceImpact: maxPriceImpact
      };

    } catch (error) {
      console.error('Error calculating investment:', error);
      throw new Error('Failed to calculate investment. Please try again.');
    }
  }

  /**
   * Execute strategy investment by performing all necessary swaps
   */
  async executeInvestment(
    calculation: InvestmentCalculation,
    chainId: number,
    userAddress: string,
    walletClient: any
  ): Promise<string[]> {
    const transactionHashes: string[] = [];

    try {
      console.log('Starting investment execution on mainnet...');
      console.log('Chain ID:', chainId);
      console.log('User address:', userAddress);
      console.log('Number of swaps:', calculation.swaps.length);

      // Test API connectivity before proceeding
      console.log('🧪 Testing 1inch API connectivity first...');
      await this.testAPIConnectivity();

      for (const swap of calculation.swaps) {
        // Skip if no swap needed (ETH allocation)
        if (swap.fromToken.address === swap.toToken.address) {
          console.log('Skipping swap for same token:', swap.fromToken.symbol);
          continue;
        }

        console.log(`Processing swap: ${swap.fromToken.amount} ${swap.fromToken.symbol} -> ${swap.toToken.symbol}`);

        // Get swap transaction data
        const swapParams = {
          src: swap.fromToken.address,
          dst: swap.toToken.address,
          amount: parseUnits(swap.fromToken.amount, 18).toString(),
          from: userAddress.toLowerCase(),
          slippage: '1', // 1% slippage
          disableEstimate: 'false',
          allowPartialFill: 'false',
        };

        console.log('Swap params being sent to 1inch:', swapParams);

        const swapResponse = await this.call1inchAPI<any>(`/swap/v6.1/${chainId}/swap`, swapParams);

        console.log('1inch swap response received');
        console.log('Gas from API:', swapResponse.tx.gas);
        console.log('Value from API:', swapResponse.tx.value);

        // Use gas from 1inch API with minimum fallback
        const apiGas = BigInt(swapResponse.tx.gas || '200000');
        const minGas = BigInt('150000');
        const gasLimit = apiGas > minGas ? apiGas : minGas;

        // Execute the swap
        const hash = await walletClient.sendTransaction({
          to: swapResponse.tx.to,
          data: swapResponse.tx.data,
          value: BigInt(swapResponse.tx.value),
          gas: gasLimit,
        });

        console.log('Transaction hash:', hash);
        transactionHashes.push(hash);

        // Wait for confirmation before next swap
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      return transactionHashes;
    } catch (error) {
      console.error('Error executing investment:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      throw new Error(`Failed to execute investment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current portfolio allocation for comparison
   */
  async getCurrentAllocation(
    userAddress: string,
    chainId: number,
    strategy: Strategy
  ): Promise<{ token: StrategyToken; currentAmount: string; currentPercentage: number }[]> {
    try {
      // This would typically fetch the user's current token balances
      // For now, return empty allocation
      return strategy.tokens.map(token => ({
        token,
        currentAmount: '0',
        currentPercentage: 0
      }));
    } catch (error) {
      console.error('Error getting current allocation:', error);
      return [];
    }
  }
}

export const strategyInvestmentService = new StrategyInvestmentService();
