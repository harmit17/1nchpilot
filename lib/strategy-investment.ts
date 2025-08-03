'use client';

import { parseUnits, formatUnits } from 'viem';
import { Strategy, StrategyToken, InvestmentCalculation, SwapAllocation, getTokenAddressForChain } from './strategies';

export class StrategyInvestmentService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_1INCH_API_URL || 'https://1inch-vercel-proxy-gamma.vercel.app';
    this.apiKey = process.env.NEXT_PUBLIC_1INCH_API_KEY || '';

    console.log('🚀 StrategyInvestmentService initialized');
    console.log('Base URL:', this.baseUrl);
    console.log('API Key available:', !!this.apiKey);

    // Validate configuration
    if (!this.apiKey) {
      console.warn('⚠️ 1inch API key not found');
    }
  }

  private isETHOrWETH(tokenAddress: string, tokenSymbol: string, chainId: number): boolean {
    const ethAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
    const wethAddresses: { [key: number]: string } = {
      1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',    // Ethereum
      42161: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', // Arbitrum
      10: '0x4200000000000000000000000000000000000006',   // Optimism
    };
    
    return tokenAddress === ethAddress || 
           tokenAddress === wethAddresses[chainId] ||
           tokenSymbol === 'ETH' || 
           tokenSymbol === 'WETH';
  }

  private validateUserAddress(address: string, chainId: number): void {
    // Check for test addresses that shouldn't be used on mainnet
    const testAddresses = [
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', // Hardhat test account #0
      '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', // Hardhat test account #1
      '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', // Hardhat test account #2
    ];

    const normalizedAddress = address.toLowerCase();
    const isTestAddress = testAddresses.includes(normalizedAddress);

    if (isTestAddress && (chainId === 1 || chainId === 42161 || chainId === 10)) {
      throw new Error(`Cannot use test address ${address} on mainnet (chain ${chainId}). Please connect a real wallet.`);
    }

    // Basic address validation
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error(`Invalid wallet address format: ${address}`);
    }
  }  /**
   * Test 1inch API connectivity with a simple request
   */
  async testAPIConnectivity(): Promise<void> {
    try {
      console.log('🧪 Testing 1inch API connectivity...');
      console.log('🔗 Using same pattern as working SwapPopup component');
      
      // Use the same endpoint pattern as the working SwapPopup (v6.1)
      const testEndpoint = `/swap/v6.1/1/quote`;
      const testParams = {
        src: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        dst: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        amount: '100000000000000000'
      };
      
      console.log('🌐 Testing with endpoint:', testEndpoint);
      console.log('🧪 Test params:', testParams);
      
      const response = await this.call1inchAPI<any>(testEndpoint, testParams);
      
      console.log('✅ API connectivity test passed');
      console.log('✅ Quote response received:', response);
    } catch (error: any) {
      console.error('❌ 1inch API connectivity test failed:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
      });
      throw error;
    }
  }

  private async call1inchAPI<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Use the exact same pattern as working SwapPopup
    const baseUrl = process.env.NEXT_PUBLIC_1INCH_API_URL || 'https://1inch-vercel-proxy-gamma.vercel.app';
    const url = new URL(baseUrl + endpoint);
    url.search = new URLSearchParams(params).toString();

    console.log('🔍 1inch API Request Details:');
    console.log('Base URL:', baseUrl);
    console.log('Endpoint:', endpoint);
    console.log('Params:', params);
    console.log('Full URL:', url.toString());
    console.log('API Key (first 10 chars):', this.apiKey.substring(0, 10) + '...');

    try {
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
        console.error('❌ 1inch API Error Response:');
        console.error('Failed URL:', url.toString());
        console.error('Failed Endpoint:', endpoint);
        console.error('Failed Params:', JSON.stringify(params, null, 2));
        console.error('Response Status:', response.status);
        console.error('Response Body:', body);
        
        // Handle specific error cases
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait before making more requests.');
        }
        if (body?.includes('No content returned')) {
          throw new Error('No liquidity available for this trading pair. Please try a different amount or token pair.');
        }
        
        throw new Error(`1inch API returned status ${response.status}: ${body}`);
      }

      const data = (await response.json()) as T;
      
      // Additional check: sometimes "No content returned" comes in a successful response
      if (typeof data === 'object' && data !== null) {
        const dataStr = JSON.stringify(data);
        if (dataStr.includes('No content returned')) {
          console.error('❌ "No content returned" found in successful response:', data);
          throw new Error('No liquidity available for this trading pair. Please try a different amount or token pair.');
        }
      }
      
      console.log('✅ 1inch API Success Response received for:', endpoint);
      console.log('Response data sample:', JSON.stringify(data).substring(0, 200) + '...');
      return data;
    } catch (error: any) {
      console.error('❌ 1inch API Error Response:');
      console.error('Failed URL:', url.toString());
      console.error('Failed Endpoint:', endpoint);
      console.error('Failed Params:', JSON.stringify(params, null, 2));
      console.error('Full error object:', error);
      
      // Handle different types of errors
      if (error.name === 'TypeError' && error.message?.includes('Failed to fetch')) {
        throw new Error('Network error - please check your internet connection');
      }
      
      // If it's a JSON parsing error, the response might be text
      if (error.name === 'SyntaxError' && error.message?.includes('JSON')) {
        console.error('❌ JSON parsing failed - response was likely not JSON');
        throw new Error('Invalid response from 1inch API - please try again');
      }
      
      // Re-throw the error if it's already formatted
      throw error;
    }
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
      console.log('🎯 Starting calculateInvestment');
      console.log('Strategy:', strategy.name);
      console.log('Investment Amount:', investmentAmountETH, 'ETH');
      console.log('Chain ID:', chainId);
      console.log('User Address:', userAddress);

      // Validate user address
      this.validateUserAddress(userAddress, chainId);

      // Validate investment amount
      const investmentAmount = parseFloat(investmentAmountETH);
      if (investmentAmount < 0.001) {
        throw new Error('Minimum investment amount is 0.001 ETH');
      }
      if (investmentAmount > 100) {
        throw new Error('Maximum investment amount is 100 ETH');
      }

      const investmentWei = parseUnits(investmentAmountETH, 18);
      const ethAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
      
      // Skip USD price calculation to avoid API issues - focus on ETH amounts
      const ethPriceUSD = 3000; // Mock price for display purposes
      const totalInvestmentUSD = parseFloat(investmentAmountETH) * ethPriceUSD;

      console.log('💰 Investment calculations:');
      console.log('ETH Price (mock):', ethPriceUSD);
      console.log('Total Investment USD:', totalInvestmentUSD);

      const swapAllocations: SwapAllocation[] = [];
      let totalGasEstimate = 0;
      let maxPriceImpact = 0;

      // Calculate swaps for each token in the strategy
      for (const token of strategy.tokens) {
        const targetPercentage = token.targetPercentage / 100;
        const targetETHAmount = parseFloat(investmentAmountETH) * targetPercentage;
        
        // Validate minimum swap amount (1inch typically requires minimum amounts)
        if (targetETHAmount < 0.0001) {
          console.log(`⚠️ Skipping ${token.symbol} - amount too small: ${targetETHAmount} ETH`);
          continue;
        }
        
        const targetWei = parseUnits(targetETHAmount.toString(), 18);

        // Get chain-specific token address
        const tokenAddress = getTokenAddressForChain(token, chainId);
        console.log(`🎯 Processing ${token.symbol}: ${tokenAddress} on chain ${chainId}`);

        if (this.isETHOrWETH(tokenAddress, token.symbol, chainId)) {
          // For ETH/WETH, no swap needed - just allocation tracking
          console.log(`💰 ETH/WETH allocation: ${targetETHAmount} ETH for ${token.symbol} (no swap required)`);
          swapAllocations.push({
            fromToken: {
              address: ethAddress,
              symbol: 'ETH',
              amount: targetETHAmount.toString(),
              amountUSD: targetETHAmount * ethPriceUSD
            },
            toToken: {
              address: ethAddress, // Use same address to indicate no swap needed
              symbol: token.symbol,
              targetAmount: targetETHAmount.toString(),
              targetAmountUSD: targetETHAmount * ethPriceUSD,
              percentage: token.targetPercentage
            }
          });
        } else {
          // Get quote for the swap
          try {
            console.log(`🔄 Getting quote for ${targetETHAmount} ETH -> ${token.symbol} (${tokenAddress})`);
            console.log(`📊 Quote API call details:`);
            console.log(`  - Chain ID: ${chainId}`);
            console.log(`  - Source: ${ethAddress} (ETH)`);
            console.log(`  - Destination: ${tokenAddress} (${token.symbol})`);
            console.log(`  - Amount: ${targetWei.toString()} wei (${targetETHAmount} ETH)`);
            
            const quoteEndpoint = `/swap/v6.1/${chainId}/quote`;
            const quoteParams = {
              src: ethAddress,
              dst: tokenAddress,
              amount: targetWei.toString()
            };
            
            console.log(`🌐 About to call: ${quoteEndpoint}`);
            console.log(`📝 Quote params:`, quoteParams);
            
            const quoteResponse = await this.call1inchAPI<any>(quoteEndpoint, quoteParams);

            const expectedTokens = quoteResponse.dstAmount;
            const expectedTokensFormatted = formatUnits(BigInt(expectedTokens), token.decimals);
            const priceImpact = parseFloat(quoteResponse.priceImpact || '0');
            
            console.log(`✅ Quote received: ${expectedTokensFormatted} ${token.symbol}, impact: ${priceImpact}%`);
            maxPriceImpact = Math.max(maxPriceImpact, priceImpact);

            swapAllocations.push({
              fromToken: {
                address: ethAddress,
                symbol: 'ETH',
                amount: targetETHAmount.toString(),
                amountUSD: targetETHAmount * ethPriceUSD
              },
              toToken: {
                address: tokenAddress,
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
            console.error(`❌ Failed to get quote for ${token.symbol} on chain ${chainId}:`);
            console.error(`  - Token address: ${tokenAddress}`);
            console.error(`  - Error:`, error);
            console.error(`  - Error message:`, error instanceof Error ? error.message : 'Unknown error');
            
            throw new Error(`Unable to get pricing for ${token.symbol}. This token may not have sufficient liquidity on chain ${chainId} or the amount (${targetETHAmount} ETH) may be too small. Try a larger investment amount or different strategy.`);
          }
        }
      }

      // Estimate total gas cost in USD (rough calculation)
      const gasPrice = 20; // gwei
      const gasCostETH = (totalGasEstimate * gasPrice * 1e-9);
      const estimatedGasUSD = gasCostETH * ethPriceUSD;

      console.log('📊 Investment calculation summary:');
      console.log('Total swaps:', swapAllocations.length);
      console.log('Estimated gas USD:', estimatedGasUSD);
      console.log('Max price impact:', maxPriceImpact);

      const result = {
        totalInvestmentUSD,
        totalInvestmentETH: investmentAmountETH,
        swaps: swapAllocations,
        estimatedGasUSD,
        priceImpact: maxPriceImpact
      };

      console.log('✅ Investment calculation completed successfully');
      return result;

    } catch (error) {
      console.error('❌ Error in calculateInvestment:', error);
      console.error('Strategy:', strategy.name);
      console.error('Chain ID:', chainId);
      console.error('Investment amount:', investmentAmountETH);
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
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
      console.log('🚀 Starting investment execution...');
      console.log('Chain ID:', chainId);
      console.log('User address:', userAddress);
      console.log('Number of swaps:', calculation.swaps.length);

      // Validate user address before proceeding
      this.validateUserAddress(userAddress, chainId);

      if (calculation.swaps.length === 0) {
        throw new Error('No swaps to execute. Please try a different strategy or investment amount.');
      }

      for (let i = 0; i < calculation.swaps.length; i++) {
        const swap = calculation.swaps[i];
        
        // Skip if no swap needed (ETH allocation or same token)
        if (swap.fromToken.address === swap.toToken.address) {
          console.log(`⏭️ Skipping swap for same token: ${swap.fromToken.symbol} -> ${swap.toToken.symbol}`);
          continue;
        }

        // Additional check for ETH/WETH cases using helper function
        const fromIsETH = this.isETHOrWETH(swap.fromToken.address, swap.fromToken.symbol, chainId);
        const toIsETH = this.isETHOrWETH(swap.toToken.address, swap.toToken.symbol, chainId);
        
        if (fromIsETH && toIsETH) {
          console.log(`⏭️ Skipping ETH/WETH conversion: ${swap.fromToken.symbol} -> ${swap.toToken.symbol} (no swap needed)`);
          continue;
        }

        // Validate swap amount
        const swapAmount = parseFloat(swap.fromToken.amount);
        if (swapAmount < 0.0001) {
          console.log(`⏭️ Skipping swap for ${swap.fromToken.symbol} - amount too small: ${swapAmount} ETH`);
          continue;
        }

        console.log(`🔄 Processing swap ${i + 1}/${calculation.swaps.length}: ${swap.fromToken.amount} ${swap.fromToken.symbol} -> ${swap.toToken.symbol}`);
        console.log(`🔍 From address: ${swap.fromToken.address}`);
        console.log(`🔍 To address: ${swap.toToken.address}`);

        try {
          // Get swap transaction data with better error handling
          const swapParams = {
            src: swap.fromToken.address,
            dst: swap.toToken.address,
            amount: parseUnits(swap.fromToken.amount, 18).toString(),
            from: userAddress.toLowerCase(),
            slippage: '1', // 1% slippage
            disableEstimate: 'false',
            allowPartialFill: 'false',
          };

          console.log('📤 Swap params being sent to 1inch:', swapParams);

          const swapResponse = await this.call1inchAPI<any>(`/swap/v6.1/${chainId}/swap`, swapParams);

          console.log('📥 1inch swap response received');
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

          console.log('✅ Transaction hash:', hash);
          transactionHashes.push(hash);

          // Wait for confirmation before next swap
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (swapError: any) {
          console.error(`❌ Error executing swap for ${swap.toToken.symbol}:`, swapError);
          
          // More specific error handling for individual swaps
          if (swapError.message?.includes('No content returned') || swapError.message?.includes('No liquidity available')) {
            throw new Error(`Trading pair ${swap.fromToken.symbol}/${swap.toToken.symbol} not available. This token may not have sufficient liquidity on this chain. Try a different strategy or smaller amount.`);
          } else if (swapError.message?.includes('user rejected')) {
            throw new Error('Transaction was rejected. Please try again.');
          } else if (swapError.message?.includes('insufficient funds')) {
            throw new Error('Insufficient ETH balance. Please check your wallet balance.');
          } else {
            throw new Error(`Failed to execute swap for ${swap.toToken.symbol}: ${swapError.message}`);
          }
        }
      }

      console.log(`🎉 Investment execution completed! ${transactionHashes.length} transactions`);
      
      // If no actual swaps were needed (e.g., all ETH allocation), still return success
      if (transactionHashes.length === 0) {
        console.log('💰 Investment completed with ETH allocation only (no swaps required)');
        // Return a dummy hash to indicate success for ETH-only allocations
        return ['0x0000000000000000000000000000000000000000000000000000000000000000'];
      }
      
      return transactionHashes;
    } catch (error) {
      console.error('❌ Error executing investment:', error);
      
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
