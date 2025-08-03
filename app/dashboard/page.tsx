'use client';

import { useNetwork, useAccount, useBalance } from 'wagmi';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, RefreshCw, AlertTriangle, User, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, Plus, TrendingUp, Settings, Wallet, ArrowUpDown, Target, Sparkles } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import PortfolioOverview from '@/components/PortfolioOverview';
import PortfolioChart from '@/components/PortfolioChart';
import TokenList from '@/components/TokenList';
import RebalancingPanel from '@/components/RebalancingPanel';
import StrategySelector from '@/components/StrategySelector';
import PortfolioAnalytics from '@/components/PortfolioAnalytics';
import SwapPopup from '@/components/SwapPopup';
import StrategyInvestment from '@/components/StrategyInvestment';
import UserStrategies from '@/components/UserStrategies';
import { Portfolio } from '@/types';
import { oneInchAPI } from '@/lib/1inch-api';
import { formatCurrency, formatProfitLoss } from '@/utils';

// Static address for demo - Vitalik's address
const STATIC_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

export default function DashboardPage() {
  const { chain } = useNetwork();
  const { address, isConnected } = useAccount();
  const { data: balance, isLoading: balanceLoading, error: balanceError, refetch: refetchBalance } = useBalance({
    address: address,
    watch: true,
    cacheTime: 2_000,
  });
  const [tokens, setTokens] = useState<any[]>([]);
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [tokenMetadata, setTokenMetadata] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRebalancing, setShowRebalancing] = useState(false);
  const [showStrategySelector, setShowStrategySelector] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showStrategyInvestment, setShowStrategyInvestment] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [useDemoMode, setUseDemoMode] = useState(true); // New state for demo mode toggle

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && chain) {
      loadPortfolio();
    }
  }, [mounted, chain, useDemoMode]); // Add useDemoMode to dependencies

  // Auto-switch to demo mode if user disconnects wallet
  useEffect(() => {
    if (!isConnected && !useDemoMode) {
      setUseDemoMode(true);
    }
  }, [isConnected, useDemoMode]);

  const loadPortfolio = async () => {
    if (!chain) return;
    
    setLoading(true);
    setError(null);
    
    // Determine which address to use
    const addressToUse = useDemoMode ? STATIC_ADDRESS : (address || STATIC_ADDRESS);
    
    try {
      const [tokenData, profitLossData] = await Promise.all([
        oneInchAPI.getPortfolioDetails(chain.id, addressToUse),
        oneInchAPI.getPortfolioProfitLoss(chain.id, addressToUse)
      ]);
      setTokens(tokenData);
      setProfitLoss(profitLossData);

      // Fetch token metadata for each token
      const metadataPromises = tokenData.map(async (token: any) => {
        const metadata = await oneInchAPI.getTokenMetadata(chain.id, token.contract_address);
        return { [token.contract_address]: metadata };
      });
      
      const metadataResults = await Promise.all(metadataPromises);
      const metadataMap = metadataResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setTokenMetadata(metadataMap);
    } catch (err) {
      setError('Failed to load portfolio data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle mode toggle
  const handleModeToggle = (toDemo: boolean) => {
    if (!toDemo && !isConnected) {
      // If trying to switch to wallet mode but not connected, do nothing
      return;
    }
    setUseDemoMode(toDemo);
  };

  // Filter balances to only show non-zero balances
  const activeBalances = tokens ? Object.entries(tokens).filter(([_, token]) => 
    parseFloat(token.amount as string) > 0
  ) : [];

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">1nchPilot</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ConnectButton />
              <button
                onClick={loadPortfolio}
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

      {/* Mode Toggle Notice */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-center text-sm text-blue-800 space-y-2 sm:space-y-0">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
            </div>
            {useDemoMode ? (
              <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 text-center sm:text-left">
                <span>Demo Mode: Showing portfolio for whale address {STATIC_ADDRESS.slice(0, 6)}...{STATIC_ADDRESS.slice(-4)}</span>
                {isConnected && (
                  <>
                    <span className="hidden sm:inline text-blue-600">•</span>
                    <button
                      onClick={() => handleModeToggle(false)}
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      Switch to your wallet
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 text-center sm:text-left">
                <span>
                  Showing portfolio for your wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <span className="hidden sm:inline text-blue-600">•</span>
                <button
                  onClick={() => handleModeToggle(true)}
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  Click here to show demo mode from whale address
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading portfolio data...</p>
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
        ) : tokens.length > 0 ? (
          <div className="space-y-8">
            {/* Portfolio Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Portfolio Overview</h2>
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              
              {profitLoss && profitLoss.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-100 mb-1">Total Portfolio Value</h3>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(tokens.reduce((total: number, token: any) => total + (token.value_usd || 0), 0))}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-600 mb-1">Total Profit/Loss</h3>
                    <p className={`text-2xl font-bold ${profitLoss[0].abs_profit_usd >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                      {formatProfitLoss(profitLoss[0].abs_profit_usd)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-green-600 mb-1">Total ROI</h3>
                    <p className={`text-2xl font-bold ${profitLoss[0].roi >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                      {(profitLoss[0].roi * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-600 mb-1">Active Tokens</h3>
                    <p className="text-2xl font-bold text-purple-900">{tokens.length}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-100 mb-1">Total Portfolio Value</h3>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(tokens.reduce((total: number, token: any) => total + (token.value_usd || 0), 0))}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-600 mb-1">Active Tokens</h3>
                    <p className="text-2xl font-bold text-purple-900">{tokens.length}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Largest Holding</h3>
                    <p className="text-xl font-bold text-gray-900">
                      {tokens.length > 0 
                        ? `${tokens.sort((a: any, b: any) => b.value_usd - a.value_usd)[0].symbol}`
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Action Buttons - Moved to top */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
            >
              <button
                onClick={() => setShowAnalytics(true)}
                className="btn btn-outline btn-lg flex-1"
              >
                <TrendingUpIcon className="w-5 h-5 mr-2" />
                Generate Analytics
              </button>
              <button
                onClick={() => setShowSwap(true)}
                className="btn btn-secondary btn-lg flex-1"
              >
                <ArrowUpDown className="w-5 h-5 mr-2" />
                Swap Tokens
              </button>
              <button
                onClick={() => setShowRebalancing(true)}
                disabled={true}
                className="btn btn-outline btn-lg flex-1 opacity-50 cursor-not-allowed"
              >
                <Settings className="w-5 h-5 mr-2" />
                Rebalance Portfolio
              </button>
              <button
                onClick={() => setShowStrategyInvestment(true)}
                className="btn btn-primary btn-lg flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0"
              >
                <Target className="w-5 h-5 mr-2" />
                Invest in Strategy
              </button>
              <button
                onClick={() => setShowStrategySelector(true)}
                className="btn btn-primary btn-lg flex-1"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Strategy
              </button>
            </motion.div>

            {/* Token Holdings */}
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
              
              {tokens.length > 0 ? (
                <>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="space-y-4 pr-2">
                      {tokens.map((token: any) => {
                        const metadata = tokenMetadata[token.contract_address];
                        return (
                          <div key={token.contract_address} className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                    {metadata?.logoURI ? (
                                      <img 
                                        src={metadata.logoURI} 
                                        alt={token.symbol}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          // Hide the image and show a fallback icon
                                          e.currentTarget.style.display = 'none';
                                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                      />
                                    ) : null}
                                    {/* Fallback icon when image fails to load or is not available */}
                                    <div className={`w-full h-full flex items-center justify-center text-gray-500 text-xs font-bold ${metadata?.logoURI ? 'hidden' : ''}`}>
                                      {token.symbol?.slice(0, 2).toUpperCase() || '??'}
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <h3 className="font-semibold text-gray-900">{token.symbol}</h3>
                                      <span className="text-sm text-gray-500">({token.name})</span>
                                    </div>
                                    <p className="text-sm font-mono text-gray-600 truncate">
                                      {token.contract_address.slice(0, 8)}...{token.contract_address.slice(-6)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right space-y-1">
                                <div className="flex items-center justify-end space-x-2">
                                  <span className="text-lg font-semibold text-gray-900">
                                    {token.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                  </span>
                                  <span className="text-sm text-gray-500">{token.symbol}</span>
                                </div>
                                <div className="flex items-center justify-end space-x-4">
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                      {formatCurrency(token.value_usd)}
                                    </p>
                                    <p className="text-xs text-gray-500">USD Value</p>
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-sm font-medium ${token.abs_profit_usd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatProfitLoss(token.abs_profit_usd)}
                                    </p>
                                    <p className="text-xs text-gray-500">Profit/Loss</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="flex items-center space-x-1">
                                      {token.roi >= 0 ? (
                                        <TrendingUpIcon className="w-3 h-3 text-green-600" />
                                      ) : (
                                        <TrendingDownIcon className="w-3 h-3 text-red-600" />
                                      )}
                                      <p className={`text-sm font-medium ${token.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {(token.roi * 100).toFixed(2)}%
                                      </p>
                                    </div>
                                    <p className="text-xs text-gray-500">ROI</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Portfolio Summary */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-900">Total Portfolio Value:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatCurrency(tokens.reduce((total: number, token: any) => total + (token.value_usd || 0), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">
                        {tokens.length} token{tokens.length !== 1 ? 's' : ''} • Last updated: {new Date().toLocaleTimeString()}
                      </span>
                      <span className="text-sm text-gray-500">
                        Largest holding: {tokens.length > 0 
                          ? `${tokens.sort((a: any, b: any) => b.value_usd - a.value_usd)[0].symbol} (${formatCurrency(tokens.sort((a: any, b: any) => b.value_usd - a.value_usd)[0].value_usd)})`
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <TrendingUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Tokens</h3>
                  <p className="text-gray-600">
                    No tokens with non-zero balances found for this address.
                  </p>
                </div>
              )}
            </motion.div>

            {/* User Strategies Section - Only show for connected users */}
            {isConnected && address && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Your Strategies
                  </h2>
                  <button
                    onClick={() => setShowStrategySelector(true)}
                    className="btn btn-outline btn-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Create New
                  </button>
                </div>
                
                <UserStrategies 
                  onSelectStrategy={(strategy) => {
                    console.log('Selected strategy for investment:', strategy);
                    setShowStrategyInvestment(true);
                  }}
                />
              </motion.div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Portfolio Data</h2>
            <p className="text-gray-600 mb-4">
              We couldn't find any tokens for this address. Try refreshing or check the network connection.
            </p>
            <button onClick={loadPortfolio} className="btn btn-primary">
              Refresh Portfolio
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-4 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span>© 2025 1nchPilot. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showStrategySelector && (
        <StrategySelector
          onClose={() => setShowStrategySelector(false)}
          onStrategyCreated={(strategy) => {
            setShowStrategySelector(false);
          }}
        />
      )}

      {showRebalancing && tokens && (
        <RebalancingPanel
          portfolio={{ totalValueUSD: 0, tokens: [], lastUpdated: new Date() }}
          onClose={() => setShowRebalancing(false)}
          onRebalanceComplete={() => {
            setShowRebalancing(false);
            loadPortfolio();
          }}
        />
      )}

      {showAnalytics && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50">
          <div className="relative">
            <PortfolioAnalytics onClose={() => setShowAnalytics(false)} />
          </div>
        </div>
      )}

      {showSwap && (
        <SwapPopup onClose={() => setShowSwap(false)} />
      )}

      {showStrategyInvestment && (
        <StrategyInvestment onClose={() => setShowStrategyInvestment(false)} />
      )}
    </div>
  );
}