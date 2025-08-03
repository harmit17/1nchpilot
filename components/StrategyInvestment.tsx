'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, TrendingUp, Shield, Zap, DollarSign, Target, CheckCircle, Info, Loader2 } from 'lucide-react';
import { useNetwork, useAccount, useWalletClient } from 'wagmi';
import { STRATEGIES, Strategy, getRiskColor, getStrategiesForChain, InvestmentCalculation } from '@/lib/strategies';
import { strategyInvestmentService } from '@/lib/strategy-investment';

interface StrategyInvestmentProps {
  onClose: () => void;
}

export default function StrategyInvestment({ onClose }: StrategyInvestmentProps) {
  const { chain } = useNetwork();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
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
    setStep('configure');
  };

  const handleInvestmentConfigure = async () => {
    if (!investmentAmount || parseFloat(investmentAmount) <= 0 || !selectedStrategy || !chain || !address) {
      setError('Please fill in all required fields and connect your wallet');
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
      setError(err.message || 'Failed to calculate investment');
    } finally {
      setLoading(false);
    }
  };

  const handleInvestmentExecute = async () => {
    if (!calculation || !chain || !address || !walletClient) {
      setError('Missing required data for execution');
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
      setError(err.message || 'Failed to execute investment');
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
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <div className="text-gray-500">TVL</div>
          <div className="font-semibold">{strategy.totalValueLocked}</div>
        </div>
        <div>
          <div className="text-gray-500">Min Investment</div>
          <div className="font-semibold">{strategy.minInvestment} ETH</div>
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
        className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
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

        {/* Content */}
        <div className="p-6">
          {step === 'select' && (
            <div>
              {/* Network Warning for non-mainnet */}
              {chain && chain.id !== 1 && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-900">⚠️ Network Notice</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Strategy investments are currently optimized for <strong>Ethereum Mainnet</strong>. 
                    Please switch to Mainnet for the best experience with 1inch APIs and strategy execution.
                  </p>
                </div>
              )}

              {/* Network Info */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Network: {chain?.name || 'Not connected'}</span>
                </div>
                <p className="text-sm text-blue-700">
                  Showing {availableStrategies.length} strategies available on this network. 
                  Strategies use 1inch Fusion for MEV protection and optimal execution.
                </p>
              </div>

              {/* Strategy Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableStrategies.map(renderStrategyCard)}
              </div>
            </div>
          )}

          {step === 'configure' && selectedStrategy && (
            <div className="max-w-2xl mx-auto">
              <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                <h4 className="text-lg font-bold text-gray-900 mb-2">{selectedStrategy.name}</h4>
                <p className="text-gray-600 mb-4">{selectedStrategy.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium ${getRiskColor(selectedStrategy.riskLevel)}`}>
                    {getRiskIcon(selectedStrategy.riskLevel)}
                    {selectedStrategy.riskLevel} Risk
                  </div>
                  <div className="text-green-600 font-semibold">{selectedStrategy.expectedAPY} APY</div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Investment Amount (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min={selectedStrategy.minInvestment}
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Minimum: ${selectedStrategy.minInvestment} ETH`}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Minimum investment: {selectedStrategy.minInvestment} ETH
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
                    disabled={loading || !investmentAmount || parseFloat(investmentAmount) < parseFloat(selectedStrategy.minInvestment)}
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
      </motion.div>
    </div>
  );
}
