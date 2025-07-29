'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Loader } from 'lucide-react';
import { Portfolio, Strategy } from '@/types';
import { formatCurrency, formatPercentage } from '@/utils';

interface RebalancingPanelProps {
  portfolio: Portfolio;
  onClose: () => void;
  onRebalanceComplete: () => void;
}

export default function RebalancingPanel({ 
  portfolio, 
  onClose, 
  onRebalanceComplete 
}: RebalancingPanelProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  const handleExecuteRebalancing = async () => {
    setIsExecuting(true);
    setExecutionStatus('pending');
    
    try {
      // Simulate rebalancing execution
      await new Promise(resolve => setTimeout(resolve, 3000));
      setExecutionStatus('success');
      
      // Close panel after success
      setTimeout(() => {
        onRebalanceComplete();
      }, 2000);
    } catch (error) {
      setExecutionStatus('error');
      console.error('Rebalancing failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Rebalance Portfolio</h2>
                <p className="text-sm text-gray-600">Review and execute your rebalancing plan</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Current vs Target */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Current Allocation</h3>
                <div className="space-y-2">
                  {portfolio.tokens.slice(0, 5).map((token) => (
                    <div key={token.token.address} className="flex justify-between text-sm">
                      <span className="text-gray-600">{token.token.symbol}</span>
                      <span className="font-medium">{formatPercentage(token.percentage)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Target Allocation</h3>
                <div className="space-y-2 text-gray-400">
                  <div className="flex justify-between text-sm">
                    <span>ETH</span>
                    <span>40%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>USDC</span>
                    <span>30%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>LDO</span>
                    <span>20%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>UNI</span>
                    <span>10%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rebalancing Plan */}
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Rebalancing Plan</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Sell ETH</p>
                      <p className="text-sm text-gray-600">Reduce position to target</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">-0.5 ETH</p>
                    <p className="text-sm text-gray-600">~$1,200</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Buy LDO</p>
                      <p className="text-sm text-gray-600">Increase position to target</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">+1,200 LDO</p>
                    <p className="text-sm text-gray-600">~$1,200</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Execution Details */}
            <div className="card p-4 bg-blue-50">
              <div className="flex items-center space-x-3 mb-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Execution Details</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform:</span>
                  <span className="font-medium">1inch Fusion</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gas Fee:</span>
                  <span className="font-medium">$0 (Gasless)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">MEV Protection:</span>
                  <span className="font-medium text-green-600">Enabled</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Time:</span>
                  <span className="font-medium">~30 seconds</span>
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {executionStatus === 'pending' && (
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                <Loader className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Executing Rebalancing</p>
                  <p className="text-sm text-gray-600">Please wait while we process your transaction...</p>
                </div>
              </div>
            )}

            {executionStatus === 'success' && (
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Rebalancing Complete!</p>
                  <p className="text-sm text-gray-600">Your portfolio has been successfully rebalanced.</p>
                </div>
              </div>
            )}

            {executionStatus === 'error' && (
              <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-gray-900">Execution Failed</p>
                  <p className="text-sm text-gray-600">Please try again or contact support.</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Total Portfolio Value: {formatCurrency(portfolio.totalValueUSD)}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="btn btn-outline"
                disabled={isExecuting}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRebalancing}
                disabled={isExecuting}
                className="btn btn-primary"
              >
                {isExecuting ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  'Execute Rebalancing'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 