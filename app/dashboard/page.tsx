'use client';

import { useAccount, useNetwork } from 'wagmi';
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
  AlertTriangle
} from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import PortfolioOverview from '@/components/PortfolioOverview';
import PortfolioChart from '@/components/PortfolioChart';
import TokenList from '@/components/TokenList';
import RebalancingPanel from '@/components/RebalancingPanel';
import StrategySelector from '@/components/StrategySelector';
import { Portfolio } from '@/types';
import { oneInchAPI } from '@/lib/1inch-api';
import { formatCurrency } from '@/utils';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRebalancing, setShowRebalancing] = useState(false);
  const [showStrategySelector, setShowStrategySelector] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isConnected && address && chain) {
      console.log(`🔄 Wallet changed: ${address} on chain ${chain.id} (${chain.name})`);
      loadPortfolio();
    }
  }, [mounted, isConnected, address, chain]);

  const loadPortfolio = async () => {
    if (!address || !chain) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Loading portfolio for chain ${chain.id} and address ${address}`);
      const portfolioData = await oneInchAPI.getPortfolioData(chain.id, address);
      setPortfolio(portfolioData);
    } catch (err) {
      console.error('Error loading portfolio:', err);
      setError('Failed to load portfolio data. Please try again.');
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

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-gray-600 mb-8">
            Connect your wallet to access your DeFi portfolio
          </p>
          <ConnectButton />
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
              {address && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>Wallet:</span>
                  <span className="font-mono text-xs text-gray-900">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </div>
              )}
              {portfolio && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>Total Value:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(portfolio.totalValueUSD)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadPortfolio}
                disabled={loading}
                className="btn btn-outline btn-sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your portfolio...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Portfolio</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button onClick={loadPortfolio} className="btn btn-primary">
              Try Again
            </button>
          </div>
        ) : portfolio ? (
          <div className="space-y-8">
            {/* Portfolio Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <PortfolioOverview portfolio={portfolio} />
            </motion.div>

            {/* Charts and Token List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Portfolio Allocation</h2>
                  <PieChart className="w-5 h-5 text-gray-400" />
                </div>
                <PortfolioChart portfolio={portfolio} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Token Holdings</h2>
                  <DollarSign className="w-5 h-5 text-gray-400" />
                </div>
                <TokenList tokens={portfolio.tokens} />
              </motion.div>
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Portfolio Data</h2>
            <p className="text-gray-600 mb-4">
              We couldn't find any tokens in your wallet. Try refreshing or check your wallet connection.
            </p>
            <button onClick={loadPortfolio} className="btn btn-primary">
              Refresh Portfolio
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
            // Handle strategy creation
            console.log('Strategy created:', strategy);
          }}
        />
      )}

      {showRebalancing && portfolio && (
        <RebalancingPanel
          portfolio={portfolio}
          onClose={() => setShowRebalancing(false)}
          onRebalanceComplete={() => {
            setShowRebalancing(false);
            loadPortfolio(); // Refresh portfolio after rebalancing
          }}
        />
      )}
    </div>
  );
} 