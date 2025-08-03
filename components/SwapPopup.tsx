'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowUpDown, Loader2, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { useNetwork, useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, formatUnits, Hex } from 'viem';

interface SwapPopupProps {
  onClose: () => void;
}

interface AllowanceResponse {
  allowance: string;
}

interface SwapResponse {
  tx: {
    from: string;
    to: Hex;
    data: Hex;
    value: string;
    gas: string;
    gasPrice: string;
  };
}

interface ApproveResponse {
  to: Hex;
  data: Hex;
  value: string;
}

export default function SwapPopup({ onClose }: SwapPopupProps) {
  const { chain } = useNetwork();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [fromTokenAddress, setFromTokenAddress] = useState('');
  const [toTokenAddress, setToTokenAddress] = useState('');
  const [amountToSwap, setAmountToSwap] = useState('');
  const [slippage, setSlippage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'approval' | 'swap' | 'complete'>('form');
  const [quote, setQuote] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Common token addresses for quick selection
  const getCommonTokens = () => {
    const chainId = chain?.id || 1; // Default to Ethereum
    
    // Ethereum mainnet tokens (including Anvil fork which uses chain ID 1)
    if (chainId === 1) {
      return [
        { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9eb0ce3606eb48', name: 'USD Coin', decimals: 6 },
        { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', name: 'Tether USD', decimals: 6 },
        { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', name: 'Dai Stablecoin', decimals: 18 },
        { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', name: 'Wrapped Ether', decimals: 18 },
        { symbol: 'UNI', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', name: 'Uniswap Token', decimals: 18 },
        { symbol: 'ETH', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', name: 'Ethereum', decimals: 18 },
      ];
    }
    
    // Anvil local fork (if using default Anvil chain ID)
    if (chainId === 31337) {
      return [
        { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9eb0ce3606eb48', name: 'USD Coin', decimals: 6 },
        { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', name: 'Tether USD', decimals: 6 },
        { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', name: 'Dai Stablecoin', decimals: 18 },
        { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', name: 'Wrapped Ether', decimals: 18 },
        { symbol: 'UNI', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', name: 'Uniswap Token', decimals: 18 },
        { symbol: 'ETH', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', name: 'Ethereum', decimals: 18 },
      ];
    }
    
    // Arbitrum mainnet tokens
    if (chainId === 42161) {
      return [
        { symbol: 'USDC', address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', name: 'USD Coin', decimals: 6 },
        { symbol: 'USDT', address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', name: 'Tether USD', decimals: 6 },
        { symbol: 'DAI', address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', name: 'Dai Stablecoin', decimals: 18 },
        { symbol: 'WETH', address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', name: 'Wrapped Ether', decimals: 18 },
        { symbol: 'ARB', address: '0x912ce59144191c1204e64559fe8253a0e49e6548', name: 'Arbitrum Token', decimals: 18 },
        { symbol: 'ETH', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', name: 'Ethereum', decimals: 18 },
      ];
    }
    
    // Default to Ethereum mainnet tokens for other networks
    return [
      { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9eb0ce3606eb48', name: 'USD Coin', decimals: 6 },
      { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', name: 'Tether USD', decimals: 6 },
      { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', name: 'Dai Stablecoin', decimals: 18 },
      { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', name: 'Wrapped Ether', decimals: 18 },
      { symbol: 'UNI', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', name: 'Uniswap Token', decimals: 18 },
      { symbol: 'ETH', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', name: 'Ethereum', decimals: 18 },
    ];
  };

  const commonTokens = getCommonTokens();

  // 1inch API functions
  const call1inchAPI = async <T,>(endpoint: string, params: Record<string, string>): Promise<T> => {
    const chainId = chain?.id || 1;
    const baseUrl = process.env.NEXT_PUBLIC_1INCH_API_URL || 'https://1inch-vercel-proxy-gamma.vercel.app';
    const url = new URL(baseUrl + endpoint);
    url.search = new URLSearchParams(params).toString();

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_1INCH_API_KEY}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`1inch API returned status ${response.status}: ${body}`);
    }

    return (await response.json()) as T;
  };

  const checkAllowance = async (tokenAddress: string, amount: string): Promise<boolean> => {
    const chainId = chain?.id || 1;
    const endpoint = `/swap/v6.1/${chainId}/approve/allowance`;
    const result = await call1inchAPI<{ allowance: string }>(endpoint, {
      tokenAddress,
      walletAddress: address!,
    });

    const allowance = BigInt(result.allowance);
    const requiredAmount = BigInt(amount);
    return allowance >= requiredAmount;
  };

  const approveToken = async (tokenAddress: string, amount: string): Promise<void> => {
    if (!address || !walletClient) {
      throw new Error('Wallet not connected');
    }

    const chainId = chain?.id || 1;
    const endpoint = `/swap/v6.1/${chainId}/approve/transaction`;
    const approveTx = await call1inchAPI<ApproveResponse>(endpoint, {
      tokenAddress,
      amount,
    });

    const hash = await walletClient.sendTransaction({
      to: approveTx.to,
      data: approveTx.data,
      value: BigInt(approveTx.value),
    });

    setTxHash(hash);
    
    // Wait for transaction confirmation
    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash });
    }
  };

  const executeSwap = async (): Promise<void> => {
    if (!address || !walletClient) {
      throw new Error('Wallet not connected');
    }

    const fromToken = commonTokens.find(t => t.address === fromTokenAddress);
    const decimals = fromToken?.decimals || 18;
    const amountInWei = parseUnits(amountToSwap, decimals);

    const swapParams = {
      src: fromTokenAddress,
      dst: toTokenAddress,
      amount: amountInWei.toString(),
      from: address.toLowerCase(),
      slippage: slippage.toString(),
      disableEstimate: 'false',
      allowPartialFill: 'false',
    };

    const chainId = chain?.id || 1;
    const endpoint = `/swap/v6.1/${chainId}/swap`;
    const swapTx = await call1inchAPI<SwapResponse>(endpoint, swapParams);

    const hash = await walletClient.sendTransaction({
      to: swapTx.tx.to,
      data: swapTx.tx.data,
      value: BigInt(swapTx.tx.value),
      gas: BigInt(swapTx.tx.gas),
    });

    setTxHash(hash);
    
    // Wait for transaction confirmation
    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash });
    }
  };

  const handleGetQuote = async () => {
    if (!fromTokenAddress || !toTokenAddress || !amountToSwap || !address || !chain) {
      setError('Please fill in all required fields and connect your wallet');
      return;
    }

    // Basic validation
    if (fromTokenAddress === toTokenAddress) {
      setError('Source and destination tokens cannot be the same');
      return;
    }

    if (parseFloat(amountToSwap) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setLoading(true);
    setError(null);
    setQuote(null);
    setSuccess(null);

    try {
      const fromToken = commonTokens.find(t => t.address === fromTokenAddress);
      const decimals = fromToken?.decimals || 18;
      const amountInWei = parseUnits(amountToSwap, decimals);

      // Get quote from 1inch API
      const quoteParams = {
        src: fromTokenAddress,
        dst: toTokenAddress,
        amount: amountInWei.toString(),
        slippage: slippage.toString(),
      };

      const chainId = chain?.id || 1;
      const endpoint = `/swap/v6.1/${chainId}/quote`;
      const quoteResult = await call1inchAPI<any>(endpoint, quoteParams);
      
      setQuote(quoteResult);
      setSuccess('Quote received successfully! Review the details below.');
      setStep('approval');
    } catch (err: any) {
      console.error('Error getting quote:', err);
      setError(err.message || 'Failed to get quote from 1inch API');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!quote || !address || !chain) {
      setError('Please get a quote first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const fromToken = commonTokens.find(t => t.address === fromTokenAddress);
      const decimals = fromToken?.decimals || 18;
      const amountInWei = parseUnits(amountToSwap, decimals);

      // Step 1: Check if approval is needed
      if (fromTokenAddress !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        setStep('approval');
        const hasAllowance = await checkAllowance(fromTokenAddress, amountInWei.toString());
        
        if (!hasAllowance) {
          setSuccess('Approving token spend...');
          await approveToken(fromTokenAddress, amountInWei.toString());
          setSuccess('Token approved! Proceeding with swap...');
        }
      }

      // Step 2: Execute the swap
      setStep('swap');
      setSuccess('Executing swap...');
      await executeSwap();
      
      setStep('complete');
      setSuccess('✅ Swap completed successfully!');
      
    } catch (err: any) {
      console.error('Error executing swap:', err);
      setError(err.message || 'Failed to execute swap');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFromTokenAddress('');
    setToTokenAddress('');
    setAmountToSwap('');
    setSlippage(1);
    setQuote(null);
    setError(null);
    setSuccess(null);
    setStep('form');
    setTxHash(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full h-[90vh] flex flex-col"
      >
        {/* Fixed Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ArrowUpDown className="w-6 h-6" />
              <h3 className="text-xl font-bold">Token Swap</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-2">
            Swap tokens using 1inch DEX aggregator
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-6 space-y-6">
          {/* Network Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Network:</strong> {chain?.name || 'Not connected'}
            </p>
            <p className="text-sm text-blue-600">
              <strong>Wallet:</strong> {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
            </p>
          </div>

          {/* Usage Guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📋 How to Use</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Enter the source token contract address (or click a preset)</li>
              <li>2. Enter the destination token contract address</li>
              <li>3. Specify the amount you want to swap</li>
              <li>4. Adjust slippage tolerance if needed (1% is recommended)</li>
              <li>5. Click "Get Quote" to see swap details</li>
              <li>6. Review the quote and click "Execute Swap" to proceed</li>
            </ol>
          </div>

          {/* From Token */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              From Token Address
            </label>
            <input
              type="text"
              value={fromTokenAddress}
              onChange={(e) => setFromTokenAddress(e.target.value)}
              placeholder="0x... (source token contract address)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {commonTokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => setFromTokenAddress(token.address)}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  {token.symbol}
                </button>
              ))}
            </div>
          </div>

          {/* To Token */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              To Token Address
            </label>
            <input
              type="text"
              value={toTokenAddress}
              onChange={(e) => setToTokenAddress(e.target.value)}
              placeholder="0x... (destination token contract address)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {commonTokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => setToTokenAddress(token.address)}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  {token.symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount to Swap
            </label>
            <input
              type="number"
              value={amountToSwap}
              onChange={(e) => setAmountToSwap(e.target.value)}
              placeholder="Enter amount (e.g., 1.5)"
              step="0.000001"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Slippage */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Slippage Tolerance (%)
            </label>
            <div className="flex gap-2">
              {[0.5, 1, 2, 3].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                    slippage === value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {value}%
                </button>
              ))}
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value) || 1)}
                placeholder="Custom"
                step="0.1"
                min="0.1"
                max="50"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-green-800 text-sm">{success}</p>
              </div>
            </div>
          )}

          {/* Step Indicator */}
          {step !== 'form' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Progress</h4>
              <div className="flex items-center justify-between text-sm">
                <div className={`flex items-center gap-2 ${step === 'approval' || step === 'swap' || step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-3 h-3 rounded-full ${step === 'approval' || step === 'swap' || step === 'complete' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Quote</span>
                </div>
                <div className={`flex items-center gap-2 ${step === 'swap' || step === 'complete' ? 'text-green-600' : step === 'approval' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-3 h-3 rounded-full ${step === 'swap' || step === 'complete' ? 'bg-green-500' : step === 'approval' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <span>Approval</span>
                </div>
                <div className={`flex items-center gap-2 ${step === 'complete' ? 'text-green-600' : step === 'swap' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-3 h-3 rounded-full ${step === 'complete' ? 'bg-green-500' : step === 'swap' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <span>Swap</span>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Hash */}
          {txHash && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Transaction:</span>
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                >
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Quote Display */}
          {quote && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Quote Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">From Amount:</span>
                  <span className="font-medium">
                    {(() => {
                      try {
                        const fromToken = commonTokens.find(t => t.address === fromTokenAddress);
                        const symbol = fromToken?.symbol || 'TOKEN';
                        return `${amountToSwap} ${symbol}`;
                      } catch (error) {
                        console.error('Error formatting from amount:', error);
                        return amountToSwap || 'N/A';
                      }
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To Amount:</span>
                  <span className="font-medium">
                    {(() => {
                      try {
                        const toToken = commonTokens.find(t => t.address === toTokenAddress);
                        const decimals = toToken?.decimals || 18;
                        const symbol = toToken?.symbol || 'TOKEN';
                        
                        // Try different possible field names from 1inch API
                        const amount = quote.toAmount || quote.toTokenAmount || quote.destAmount || quote.dstAmount;
                        
                        if (!amount) {
                          return 'N/A';
                        }
                        
                        // Convert from wei to readable format
                        const formattedAmount = formatUnits(BigInt(amount), decimals);
                        return `${parseFloat(formattedAmount).toFixed(6)} ${symbol}`;
                      } catch (error) {
                        console.error('Error formatting to amount:', error);
                        return 'N/A';
                      }
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Exchange Rate:</span>
                  <span className="font-medium">
                    {(() => {
                      try {
                        const fromToken = commonTokens.find(t => t.address === fromTokenAddress);
                        const toToken = commonTokens.find(t => t.address === toTokenAddress);
                        const fromSymbol = fromToken?.symbol || 'TOKEN';
                        const toSymbol = toToken?.symbol || 'TOKEN';
                        
                        const toAmount = quote.toAmount || quote.toTokenAmount || quote.destAmount || quote.dstAmount;
                        if (!toAmount || !amountToSwap) return 'N/A';
                        
                        const toDecimals = toToken?.decimals || 18;
                        const formattedToAmount = formatUnits(BigInt(toAmount), toDecimals);
                        const rate = parseFloat(formattedToAmount) / parseFloat(amountToSwap);
                        
                        return `1 ${fromSymbol} = ${rate.toFixed(6)} ${toSymbol}`;
                      } catch (error) {
                        console.error('Error calculating exchange rate:', error);
                        return 'N/A';
                      }
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Gas:</span>
                  <span className="font-medium">
                    {(() => {
                      // Use the gas value from 1inch API response
                      const gasValue = quote.gas;
                      
                      if (gasValue) {
                        try {
                          // Format gas value with commas for readability
                          const gasNumber = typeof gasValue === 'string' ? parseInt(gasValue) : gasValue;
                          return gasNumber.toLocaleString();
                        } catch (error) {
                          console.error('Error formatting gas value:', error);
                          return gasValue.toString();
                        }
                      }
                      
                      return 'N/A';
                    })()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {step === 'form' && (
              <button
                onClick={handleGetQuote}
                disabled={loading || !fromTokenAddress || !toTokenAddress || !amountToSwap}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Getting Quote...
                  </>
                ) : (
                  'Get Quote'
                )}
              </button>
            )}

            {(step === 'approval' || step === 'swap') && quote && (
              <button
                onClick={handleSwap}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {step === 'approval' ? 'Processing...' : 'Swapping...'}
                  </>
                ) : (
                  'Execute Swap'
                )}
              </button>
            )}

            {step === 'complete' && (
              <button
                onClick={clearForm}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200"
              >
                New Swap
              </button>
            )}

            <button
              onClick={clearForm}
              disabled={loading}
              className="px-4 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Clear
            </button>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-yellow-800 text-sm">
                <p className="font-semibold mb-1">Important Notice:</p>
                <ul className="space-y-1 text-xs">
                  <li>• This is a demo implementation. Actual swaps require wallet transaction signing.</li>
                  <li>• Always verify token addresses before swapping.</li>
                  <li>• High slippage may result in significant price impact.</li>
                  <li>• Gas fees will be deducted from your wallet balance.</li>
                </ul>
              </div>
            </div>
          </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
