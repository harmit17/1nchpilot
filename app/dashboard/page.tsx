'use client';

import { useNetwork } from 'wagmi';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart,
  RefreshCw,
  Settings,
  Plus,
  AlertTriangle,
  User
} from 'lucide-react';
import PortfolioOverview from '@/components/PortfolioOverview';
import PortfolioChart from '@/components/PortfolioChart';
import TokenList from '@/components/TokenList';
import RebalancingPanel from '@/components/RebalancingPanel';
import StrategySelector from '@/components/StrategySelector';
import { Portfolio } from '@/types';
import { oneInchAPI } from '@/lib/1inch-api';
import { formatCurrency } from '@/utils';

// Static address for demo - Vitalik's address
const STATIC_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

export default function DashboardPage() {
  const { chain } = useNetwork();
  const [balances, setBalances] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRebalancing, setShowRebalancing] = useState(false);
  const [showStrategySelector, setShowStrategySelector] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && chain) {
      console.log(`🔄 Loading balances for static address: ${STATIC_ADDRESS} on chain ${chain.id} (${chain.name})`);
      loadBalances();
    }
  }, [mounted, chain]);

  const loadBalances = async () => {
    if (!chain) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Loading balances for chain ${chain.id} and address ${STATIC_ADDRESS}`);
      const balanceData = await oneInchAPI.getWalletBalances(chain.id, STATIC_ADDRESS);
      setBalances(balanceData);
      console.log('✅ Balance data loaded:', balanceData);
    } catch (err) {
      console.error('Error loading balances:', err);
      setError('Failed to load balance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              {chain && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>Network:</span>
                  <span className="font-semibold text-gray-900">
                    {chain.name} ({chain.id})
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Static Address:</span>
                <span className="font-mono text-xs text-gray-900 flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  {STATIC_ADDRESS.slice(0, 6)}...{STATIC_ADDRESS.slice(-4)}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadBalances}
                disabled={loading}
                className="btn btn-outline btn-sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Demo Notice */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center text-sm text-blue-800">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span>Demo Mode: Showing balances for address {STATIC_ADDRESS.slice(0, 6)}...{STATIC_ADDRESS.slice(-4)}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading balance data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Balances</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button onClick={loadBalances} className="btn btn-primary">
              Try Again
            </button>
          </div>
        ) : balances ? (
          <div className="space-y-8">
            {/* Balance Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Token Balances</h2>
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(balances).slice(0, 20).map(([tokenAddress, balance]) => (
                    <div key={tokenAddress} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-mono text-gray-600 truncate">
                            {tokenAddress.slice(0, 8)}...{tokenAddress.slice(-6)}
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {parseFloat(balance as string).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded ${
                            parseFloat(balance as string) > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {parseFloat(balance as string) > 0 ? 'Active' : 'Zero'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {Object.keys(balances).length > 20 && (
                  <div className="text-center text-sm text-gray-500">
                    Showing first 20 tokens of {Object.keys(balances).length} total tokens
                  </div>
                )}
              </div>
            </motion.div>

            {/* Summary Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="card p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Tokens</h3>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(balances).length}</p>
              </div>
              <div className="card p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Active Tokens</h3>
                <p className="text-2xl font-bold text-green-600">
                  {Object.values(balances).filter(balance => 
                    parseFloat(balance as string) > 0
                  ).length}
                </p>
              </div>
              <div className="card p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Zero Balance Tokens</h3>
                <p className="text-2xl font-bold text-gray-400">
                  {Object.values(balances).filter(balance => 
                    parseFloat(balance as string) === 0
                  ).length}
                </p>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                onClick={() => setShowStrategySelector(true)}
                className="btn btn-primary btn-lg flex-1"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Strategy
              </button>
              <button
                onClick={() => setShowRebalancing(true)}
                className="btn btn-secondary btn-lg flex-1"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Rebalance Portfolio
              </button>
              <button className="btn btn-outline btn-lg">
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </button>
            </motion.div>
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Balance Data</h2>
            <p className="text-gray-600 mb-4">
              We couldn't find any balance data for this address. Try refreshing or check the network connection.
            </p>
            <button onClick={loadBalances} className="btn btn-primary">
              Refresh Balances
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      {showStrategySelector && (
        <StrategySelector
          onClose={() => setShowStrategySelector(false)}
          onStrategyCreated={(strategy) => {
            setShowStrategySelector(false);
            console.log('Strategy created:', strategy);
          }}
        />
      )}

      {showRebalancing && balances && (
        <RebalancingPanel
          portfolio={{ totalValueUSD: 0, tokens: [], lastUpdated: new Date() }}
          onClose={() => setShowRebalancing(false)}
          onRebalanceComplete={() => {
            setShowRebalancing(false);
            loadBalances();
          }}
        />
      )}
    </div>
  );
}