'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, TrendingUp, Shield, Zap, DollarSign, Target, CheckCircle, Info, Loader2, Calendar } from 'lucide-react';
import { useNetwork, useAccount, useWalletClient } from 'wagmi';
import { STRATEGIES, Strategy, getRiskColor, getStrategiesForChain, InvestmentCalculation } from '@/lib/strategies';
import { strategyInvestmentService } from '@/lib/strategy-investment';
import { useUserStrategies } from '@/hooks/useUserStrategies';
import { Strategy as SavedStrategy } from '@/types';

interface StrategyInvestmentProps {
  onClose: () => void;
}

export default function StrategyInvestment({ onClose }: StrategyInvestmentProps) {
  const { chain } = useNetwork();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { strategies: userStrategies, loading: loadingStrategies } = useUserStrategies();
  
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [selectedSavedStrategy, setSelectedSavedStrategy] = useState<SavedStrategy | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [step, setStep] = useState<'select' | 'configure' | 'review' | 'execute' | 'complete'>('select');
  const [loading, setLoading] = useState(false);
  const [calculation, setCalculation] = useState<InvestmentCalculation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transactionHashes, setTransactionHashes] = useState<string[]>([]);

  // Get strategies available for current chain
  const availableStrategies = chain ? getStrategiesForChain(chain.id) : STRATEGIES;

  const getRiskIcon = (risk: Strategy['riskLevel']) => {
    switch (risk) {
      case 'Conservative': return <Shield className="w-5 h-5" />;
      case 'Moderate': return <TrendingUp className="w-5 h-5" />;
      case 'Aggressive': return <Zap className="w-5 h-5" />;
    }
  };

  const handleStrategySelect = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setSelectedSavedStrategy(null);
    setStep('configure');
  };

  const handleSavedStrategySelect = (savedStrategy: SavedStrategy) => {
    // Convert saved strategy to investment strategy format
    const convertedStrategy: Strategy = {
      id: `saved-${savedStrategy.id}`,
      name: savedStrategy.name,
      description: savedStrategy.description || 'Your custom strategy',
      riskLevel: 'Moderate' as const, // Default risk level for saved strategies
      expectedAPY: '8-15%', // Default expected APY
      chains: [savedStrategy.targetAllocation[0]?.token.chainId || 1],
      benefits: ['Customized allocation', 'Your personal strategy', 'Flexible rebalancing'],
      tokens: savedStrategy.targetAllocation.map(allocation => ({
        address: allocation.token.address,
        symbol: allocation.token.symbol,
        name: allocation.token.name || allocation.token.symbol,
        targetPercentage: allocation.targetPercentage,
        color: getTokenColor(allocation.token.symbol), // Helper function for colors
        decimals: allocation.token.decimals || 18
      }))
    };
    
    setSelectedStrategy(convertedStrategy);
    setSelectedSavedStrategy(savedStrategy);
    setStep('configure');
  };

  // Helper function to get token colors
  const getTokenColor = (symbol: string): string => {
    const colorMap: { [key: string]: string } = {
      'ETH': '#627EEA',
      'USDC': '#2775CA',
      'USDT': '#26A17B',
      'ARB': '#28A0F0',
      'UNI': '#FF007A',
      'LINK': '#375BD2',
      'WBTC': '#F09242',
      'DAI': '#F5AC37',
    };
    return colorMap[symbol] || '#6B7280'; // Default gray
  };

  const handleInvestmentConfigure = async () => {
    if (!investmentAmount || parseFloat(investmentAmount) <= 0 || !selectedStrategy || !chain || !address) {
      setError('Please enter an investment amount and connect your wallet');
      return;
    }

    // Validate investment amount
    const amount = parseFloat(investmentAmount);
    if (amount < 0.001) {
      setError('Minimum investment amount is 0.001 ETH');
      return;
    }
    if (amount > 100) {
      setError('Maximum investment amount is 100 ETH per transaction');
      return;
    }

    // Check for test addresses
    const testAddresses = [
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', 
      '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
    ];

    if (testAddresses.includes(address.toLowerCase())) {
      setError('Test wallets cannot be used on mainnet. Please connect a real wallet with funds.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const calc = await strategyInvestmentService.calculateInvestment(
        selectedStrategy,
        investmentAmount,
        chain.id,
        address
      );

      setCalculation(calc);
      setStep('review');
    } catch (err: any) {
      console.error('❌ Error calculating investment:', err);
      let errorMessage = err.message || 'Failed to calculate investment';
      
      // Handle specific error types with better user messaging
      if (err.message?.includes('Unable to get pricing')) {
        errorMessage = err.message; // Use the detailed message from the service
      } else if (err.message?.includes('Minimum investment amount')) {
        errorMessage = 'Investment amount too small. Please enter at least 0.001 ETH.';
      } else if (err.message?.includes('Maximum investment amount')) {
        errorMessage = 'Investment amount too large. Please enter less than 100 ETH.';
      } else if (err.message?.includes('test address')) {
        errorMessage = 'Test wallets cannot be used. Please connect a real wallet.';
      } else if (err.message?.includes('Rate limit exceeded')) {
        errorMessage = 'API rate limit reached. Please wait a moment and try again.';
      } else if (err.message?.includes('Invalid request parameters')) {
        errorMessage = 'Invalid request. Please check your wallet connection and network.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInvestmentExecute = async () => {
    if (!calculation || !chain || !address || !walletClient) {
      setError('Missing required data for execution');
      return;
    }

    // Check for test addresses
    const testAddresses = [
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', 
      '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
    ];

    if (testAddresses.includes(address.toLowerCase())) {
      setError('Test wallets cannot be used on mainnet. Please connect a real wallet with funds.');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('execute');
    
    try {
      const hashes = await strategyInvestmentService.executeInvestment(
        calculation,
        chain.id,
        address,
        walletClient
      );
      
      setTransactionHashes(hashes);
      setStep('complete');
    } catch (err: any) {
      console.error('❌ Error executing investment:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      
      let errorMessage = err.message || 'Failed to execute investment';
      
      // Handle specific error types
      if (err.message?.includes('Rate limit exceeded')) {
        errorMessage = 'API rate limit exceeded. Please wait a moment and try again.';
      } else if (err.message?.includes('test address')) {
        errorMessage = 'Test wallets cannot be used on mainnet. Please connect a real wallet.';
      } else if (err.message?.includes('Invalid request parameters')) {
        errorMessage = 'Invalid request. Please check your wallet connection and try again.';
      } else if (err.message?.includes('No content returned') || err.message?.includes('No liquidity available')) {
        errorMessage = 'Trading pair not available. Please try a different amount or strategy.';
      } else if (err.message?.includes('Network error')) {
        errorMessage = 'Network connection issue. Please check your internet connection and try again.';
      } else if (err.message?.includes('Invalid response from 1inch API')) {
        errorMessage = 'API response error. Please try again in a moment.';
      }
      
      setError(errorMessage);
      setStep('review');
    } finally {
      setLoading(false);
    }
  };

  const renderStrategyCard = (strategy: Strategy) => (
    <motion.div
      key={strategy.id}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 cursor-pointer hover:shadow-xl transition-all duration-200"
      onClick={() => handleStrategySelect(strategy)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{strategy.name}</h3>
          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(strategy.riskLevel)}`}>
            {getRiskIcon(strategy.riskLevel)}
            {strategy.riskLevel} Risk
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">{strategy.expectedAPY}</div>
          <div className="text-sm text-gray-500">Expected APY</div>
        </div>
      </div>

      <p className="text-gray-600 mb-4">{strategy.description}</p>

      {/* Token Allocation */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-2">Portfolio Allocation</h4>
        <div className="space-y-2">
          {strategy.tokens.map((token) => (
            <div key={token.address} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: token.color }}
                />
                <span className="font-medium">{token.symbol}</span>
                <span className="text-sm text-gray-500">{token.name}</span>
              </div>
              <span className="font-semibold">{token.targetPercentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 mb-4 text-sm">
        <div>
          <div className="text-gray-500">TVL</div>
          <div className="font-semibold">{strategy.totalValueLocked}</div>
        </div>
      </div>

      {/* Benefits */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Key Benefits</h4>
        <ul className="space-y-1">
          {strategy.benefits.slice(0, 2).map((benefit, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              {benefit}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );

  const renderSavedStrategyCard = (savedStrategy: SavedStrategy) => (
    <motion.div
      key={savedStrategy.id}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg border-2 border-blue-200 p-6 cursor-pointer hover:shadow-xl transition-all duration-200"
      onClick={() => handleSavedStrategySelect(savedStrategy)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">{savedStrategy.name}</h3>
          </div>
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <Target className="w-3 h-3" />
            Your Strategy
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-blue-600">Custom</div>
          <div className="text-sm text-gray-500">Portfolio</div>
        </div>
      </div>

      <p className="text-gray-600 mb-4">{savedStrategy.description}</p>

      {/* Token Allocation */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-2">Portfolio Allocation</h4>
        <div className="space-y-2">
          {savedStrategy.targetAllocation.slice(0, 4).map((allocation) => (
            <div key={allocation.token.address} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getTokenColor(allocation.token.symbol) }}
                />
                <span className="text-sm font-medium">{allocation.token.symbol}</span>
              </div>
              <span className="text-sm text-gray-600">{allocation.targetPercentage}%</span>
            </div>
          ))}
          {savedStrategy.targetAllocation.length > 4 && (
            <div className="text-xs text-gray-500 text-center">
              +{savedStrategy.targetAllocation.length - 4} more tokens
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Created {new Date(savedStrategy.createdAt).toLocaleDateString()}
        </div>
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
          Ready to Invest
        </span>
      </div>
    </motion.div>
  );

  const renderTokenAllocation = () => {
    if (!selectedStrategy || !investmentAmount) return null;
    
    if (calculation) {
      // Show calculated allocation with real quotes
      return (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Investment Breakdown</h4>
          <div className="space-y-3">
            {calculation.swaps.map((swap, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: selectedStrategy.tokens.find(t => t.address === swap.toToken.address)?.color || '#gray' }}
                  />
                  <div>
                    <div className="font-medium">{swap.toToken.symbol}</div>
                    <div className="text-sm text-gray-500">{swap.toToken.percentage}%</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{parseFloat(swap.fromToken.amount).toFixed(4)} ETH</div>
                  <div className="text-sm text-gray-500">≈ ${swap.fromToken.amountUSD.toFixed(0)}</div>
                  {swap.quote && (
                    <div className="text-xs text-green-600">
                      → {parseFloat(swap.toToken.targetAmount).toFixed(4)} {swap.toToken.symbol}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Investment:</span>
              <span className="font-semibold">${calculation.totalInvestmentUSD.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estimated Gas:</span>
              <span className="text-red-600">${calculation.estimatedGasUSD.toFixed(2)}</span>
            </div>
            {calculation.priceImpact > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Max Price Impact:</span>
                <span className={calculation.priceImpact > 5 ? 'text-red-600' : 'text-yellow-600'}>
                  {calculation.priceImpact.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Show estimated allocation before calculation
    const totalInvestment = parseFloat(investmentAmount);
    
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Estimated Investment Breakdown</h4>
        <div className="space-y-3">
          {selectedStrategy.tokens.map((token) => {
            const allocation = (totalInvestment * token.targetPercentage) / 100;
            return (
              <div key={token.address} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: token.color }}
                  />
                  <div>
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-sm text-gray-500">{token.targetPercentage}%</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{allocation.toFixed(4)} ETH</div>
                  <div className="text-sm text-gray-500">≈ ${(allocation * 3400).toFixed(0)}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-xs text-gray-500">
          * Final amounts will be calculated based on current market prices
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col"
      >
        {/* Fixed Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6" />
              <h3 className="text-xl font-bold">
                {step === 'select' && 'Choose Investment Strategy'}
                {step === 'configure' && `Configure ${selectedStrategy?.name}`}
                {step === 'review' && 'Review Investment'}
                {step === 'execute' && 'Executing Investment'}
                {step === 'complete' && 'Investment Complete!'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-2">
            {step === 'select' && 'Select a strategy that matches your risk tolerance and investment goals'}
            {step === 'configure' && 'Set your investment amount and review the allocation'}
            {step === 'review' && 'Review your investment details before execution'}
            {step === 'execute' && 'Processing your investment using 1inch APIs...'}
            {step === 'complete' && 'Your investment has been successfully executed!'}
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-6">
          {step === 'select' && (
            <div>
              {/* Network Info */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Network: {chain?.name || 'Not connected'}</span>
                </div>
                <p className="text-sm text-blue-700">
                  Showing {availableStrategies.length} predefined strategies available on this network. 
                  Strategies use 1inch Fusion for MEV protection and optimal execution.
                </p>
              </div>

              {/* Saved Strategies Section */}
              {address && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="w-6 h-6 text-blue-600" />
                    Your Saved Strategies
                  </h3>
                  
                  {loadingStrategies ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 text-blue-600 mx-auto mb-2 animate-spin" />
                      <p className="text-gray-600">Loading your strategies...</p>
                    </div>
                  ) : userStrategies.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                      {userStrategies.map(renderSavedStrategyCard)}
                    </div>
                  ) : (
                    <div className="text-center py-6 mb-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm mb-2">No saved strategies yet</p>
                      <p className="text-gray-500 text-xs">Create your first strategy to see it here</p>
                    </div>
                  )}
                </div>
              )}

              {/* Predefined Strategy Templates */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  Predefined Strategies
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableStrategies.map(renderStrategyCard)}
                </div>
              </div>
            </div>
          )}

          {step === 'configure' && selectedStrategy && (
            <div className="max-w-2xl mx-auto">
              <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3 mb-4">
                  {selectedSavedStrategy ? (
                    <Target className="w-6 h-6 text-blue-600 mt-1" />
                  ) : (
                    getRiskIcon(selectedStrategy.riskLevel)
                  )}
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{selectedStrategy.name}</h4>
                    <p className="text-gray-600 mb-4">{selectedStrategy.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  {selectedSavedStrategy ? (
                    <>
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium bg-blue-100 text-blue-800">
                        <Target className="w-3 h-3" />
                        Your Strategy
                      </div>
                      <div className="text-gray-600">
                        Created {new Date(selectedSavedStrategy.createdAt).toLocaleDateString()}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium ${getRiskColor(selectedStrategy.riskLevel)}`}>
                        {getRiskIcon(selectedStrategy.riskLevel)}
                        {selectedStrategy.riskLevel} Risk
                      </div>
                      <div className="text-green-600 font-semibold">{selectedStrategy.expectedAPY} APY</div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Investment Amount (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter amount in ETH"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter any amount in ETH
                  </p>
                </div>

                {renderTokenAllocation()}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('select')}
                    disabled={loading}
                    className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Back to Strategies
                  </button>
                  <button
                    onClick={handleInvestmentConfigure}
                    disabled={loading || !investmentAmount || parseFloat(investmentAmount) <= 0}
                    className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'Calculating...' : 'Review Investment'}
                  </button>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'review' && selectedStrategy && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Investment Summary</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-500">Strategy</div>
                    <div className="font-semibold">{selectedStrategy.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total Investment</div>
                    <div className="font-semibold">{investmentAmount} ETH</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Expected APY</div>
                    <div className="font-semibold text-green-600">{selectedStrategy.expectedAPY}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Risk Level</div>
                    <div className="font-semibold">{selectedStrategy.riskLevel}</div>
                  </div>
                </div>
              </div>

              {renderTokenAllocation()}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-yellow-800">Transaction Details</h5>
                    <p className="text-sm text-yellow-700 mt-1">
                      This investment will be executed using 1inch Fusion for MEV protection and optimal pricing. 
                      Multiple swaps will be batched for gas efficiency. Estimated execution time: 2-5 minutes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('configure')}
                  disabled={loading}
                  className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Modify Investment
                </button>
                <button
                  onClick={handleInvestmentExecute}
                  disabled={loading}
                  className="flex-1 py-3 px-6 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Execute Investment
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 'execute' && (
            <div className="max-w-md mx-auto text-center space-y-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Target className="w-8 h-8 text-blue-600" />
                </motion.div>
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Executing Investment</h4>
                <p className="text-gray-600">
                  Processing your investment using 1inch APIs for optimal execution...
                </p>
              </div>
              <div className="space-y-2 text-sm text-gray-500">
                <div>✅ Calculating optimal swap routes</div>
                <div>⏳ Executing swaps via 1inch Fusion</div>
                <div>⏳ Updating portfolio allocation</div>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="max-w-md mx-auto text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Investment Complete!</h4>
                <p className="text-gray-600">
                  Your investment in {selectedStrategy?.name} has been successfully executed.
                </p>
              </div>

              {transactionHashes.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-semibold text-blue-800 mb-2">Transaction Hashes</h5>
                  <div className="space-y-1">
                    {transactionHashes.map((hash, index) => (
                      <div key={index} className="text-sm">
                        <a
                          href={`${chain?.blockExplorers?.default?.url}/tx/${hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-mono"
                        >
                          {hash.slice(0, 8)}...{hash.slice(-8)}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="font-semibold text-green-800 mb-2">What's Next?</h5>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Monitor your portfolio performance on the dashboard</li>
                  <li>• Set up automatic rebalancing (coming soon)</li>
                  <li>• Track your strategy's performance over time</li>
                </ul>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                View Portfolio
              </button>
            </div>
          )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
