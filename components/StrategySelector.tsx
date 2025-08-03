'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, CheckCircle, Settings, Loader2, Target, Calendar, Trash2 } from 'lucide-react';
import { useAccount, useNetwork } from 'wagmi';
import { Strategy, DEFAULT_STRATEGY_TEMPLATES } from '@/types';
import { useUserStrategies } from '@/hooks/useUserStrategies';

interface StrategySelectorProps {
  onClose: () => void;
  onStrategyCreated: (strategy: Strategy) => void;
}

// Known token addresses (can't be edited)
const KNOWN_TOKEN_ADDRESSES = {
  'ETH': '0x0000000000000000000000000000000000000000', // Native ETH
  'USDC': '0xA0b86a33E6441e13Ff5B0B4d32aFf52E16ADE2e4', // USDC on Arbitrum
  'ARB': '0x912CE59144191C1204E64559FE8253a0e49E6548',  // ARB token
  'UNI': '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0'   // UNI on Arbitrum
};

const KNOWN_ADDRESSES = Object.values(KNOWN_TOKEN_ADDRESSES);

const TOKEN_DESCRIPTIONS = {
  'ETH': '✓ Native ETH (Ethereum)',
  'USDC': '✓ USD Coin (Arbitrum)', 
  'ARB': '✓ Arbitrum Token',
  'UNI': '✓ Uniswap Token (Arbitrum)'
};

export default function StrategySelector({ onClose, onStrategyCreated }: StrategySelectorProps) {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { strategies: userStrategies, loading: loadingStrategies, fetchStrategies, deleteStrategy } = useUserStrategies();
  
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customAllocations, setCustomAllocations] = useState<Array<{ symbol: string; address: string; percentage: number }>>([]);
  const [strategyName, setStrategyName] = useState('');
  const [step, setStep] = useState<'template' | 'custom' | 'review'>('template');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingStrategy, setDeletingStrategy] = useState<string | null>(null);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = DEFAULT_STRATEGY_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setCustomAllocations(template.allocations.map(allocation => ({
        ...allocation,
        address: '' // Templates don't have addresses, will be resolved later
      })));
      setStrategyName(template.name);
    }
    setStep('review');
  };

  const handleCreateCustom = () => {
    setSelectedTemplate(null);
    setCustomAllocations([
      { symbol: 'ETH', address: KNOWN_TOKEN_ADDRESSES.ETH, percentage: 40 },
      { symbol: 'USDC', address: KNOWN_TOKEN_ADDRESSES.USDC, percentage: 30 },
      { symbol: 'ARB', address: KNOWN_TOKEN_ADDRESSES.ARB, percentage: 20 },
      { symbol: 'UNI', address: KNOWN_TOKEN_ADDRESSES.UNI, percentage: 10 },
    ]);
    setStrategyName('Custom Strategy');
    setStep('custom');
  };

  const handleDeleteStrategy = async (strategyId: string, strategyName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    
    if (!confirm(`Are you sure you want to delete "${strategyName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingStrategy(strategyId);
    setError(null);

    try {
      await deleteStrategy(strategyId);
      // Success feedback could be added here
    } catch (err: any) {
      setError(err.message || 'Failed to delete strategy');
    } finally {
      setDeletingStrategy(null);
    }
  };

  const handleAllocationChange = (index: number, field: 'symbol' | 'address' | 'percentage', value: string | number) => {
    const newAllocations = [...customAllocations];
    newAllocations[index] = {
      ...newAllocations[index],
      [field]: field === 'percentage' ? Number(value) : value,
    };
    setCustomAllocations(newAllocations);
  };

  const addAllocation = () => {
    setCustomAllocations([...customAllocations, { symbol: '', address: '', percentage: 0 }]);
  };

  const removeAllocation = (index: number) => {
    setCustomAllocations(customAllocations.filter((_, i) => i !== index));
  };

  const handleCreateStrategy = async () => {
    if (!address) {
      setError('Please connect your wallet to create a strategy');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Prepare strategy data for MongoDB
      const strategyData = {
        walletAddress: address,
        name: strategyName,
        description: selectedTemplate ? 
          DEFAULT_STRATEGY_TEMPLATES.find(t => t.id === selectedTemplate)?.description : 
          'Custom portfolio strategy',
        targetAllocation: customAllocations.map(allocation => ({
          token: {
            address: allocation.address || '', 
            symbol: allocation.symbol,
            name: allocation.symbol,
            decimals: 18,
            chainId: chain?.id || 1,
          },
          targetPercentage: allocation.percentage,
        })),
        driftThreshold: 5,
        autoRebalance: false,
        chainId: chain?.id || 1,
      };

      // Save to MongoDB via API
      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(strategyData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save strategy');
      }

      // Create local strategy object for immediate UI feedback
      const strategy: Strategy = {
        id: result.data.id,
        name: result.data.name,
        description: result.data.description,
        targetAllocation: result.data.targetAllocation,
        isActive: result.data.isActive,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.createdAt),
        userId: address, // Use wallet address as user ID
        driftThreshold: 5,
        autoRebalance: false,
      };

      onStrategyCreated(strategy);
      
      // Refresh the strategies list
      fetchStrategies();
      
      onClose();
    } catch (err: any) {
      console.error('Error creating strategy:', err);
      setError(err.message || 'Failed to create strategy. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const totalPercentage = customAllocations.reduce((sum, allocation) => sum + allocation.percentage, 0);
  const isValid = strategyName.trim() && totalPercentage === 100 && customAllocations.every(a => a.symbol.trim() && (a.address.trim() || true)); // Allow empty address for now

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
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fixed Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Create Strategy</h2>
                <p className="text-sm text-gray-600">Choose a template or create your own</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="p-6">
            {step === 'template' && (
              <div className="space-y-6">
                {/* Saved Strategies Section */}
                {address && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Saved Strategies</h3>
                    {loadingStrategies ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-6 h-6 text-blue-600 mx-auto mb-2 animate-spin" />
                        <p className="text-gray-600">Loading your strategies...</p>
                      </div>
                    ) : userStrategies.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {userStrategies.map((strategy) => (
                          <div
                            key={strategy.id}
                            className="relative card p-4 cursor-pointer hover:shadow-md transition-shadow border-2 border-blue-200 bg-blue-50"
                          >
                            {/* Delete Button */}
                            <button
                              onClick={(e) => handleDeleteStrategy(strategy.id, strategy.name, e)}
                              disabled={deletingStrategy === strategy.id}
                              className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"
                              title="Delete strategy"
                            >
                              {deletingStrategy === strategy.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>

                            {/* Strategy Content */}
                            <div
                              onClick={() => {
                                // Use saved strategy as template
                                setSelectedTemplate(`saved-${strategy.id}`);
                                setCustomAllocations(strategy.targetAllocation.map(allocation => ({
                                  symbol: allocation.token.symbol,
                                  address: allocation.token.address,
                                  percentage: allocation.targetPercentage
                                })));
                                setStrategyName(`${strategy.name} (Copy)`);
                                setStep('review');
                              }}
                              className="pr-8" // Add padding to avoid overlap with delete button
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-gray-900">{strategy.name}</h4>
                                <Target className="w-4 h-4 text-blue-600" />
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>
                              <div className="space-y-1 mb-3">
                                {strategy.targetAllocation.slice(0, 3).map((allocation, index) => (
                                  <div key={index} className="flex justify-between text-sm">
                                    <span className="text-gray-600">{allocation.token.symbol}</span>
                                    <span className="font-medium">{allocation.targetPercentage}%</span>
                                  </div>
                                ))}
                                {strategy.targetAllocation.length > 3 && (
                                  <div className="text-xs text-gray-500">
                                    +{strategy.targetAllocation.length - 3} more tokens
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center text-xs text-gray-500">
                                <Calendar className="w-3 h-3 mr-1" />
                                Created {new Date(strategy.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 mb-6">
                        <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">No saved strategies yet</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategy Templates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DEFAULT_STRATEGY_TEMPLATES.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => handleTemplateSelect(template.id)}
                        className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <h4 className="font-semibold text-gray-900 mb-2">{template.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                        <div className="space-y-1">
                          {template.allocations.map((allocation, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-600">{allocation.symbol}</span>
                              <span className="font-medium">{allocation.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="text-center">
                  <button
                    onClick={handleCreateCustom}
                    className="btn btn-outline btn-lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Custom Strategy
                  </button>
                </div>
              </div>
            )}

            {step === 'custom' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Strategy</h3>
                  <input
                    type="text"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    placeholder="Strategy Name"
                    className="input w-full mb-4"
                  />
                  
                  <div className="space-y-3">
                    {customAllocations.map((allocation, index) => (
                      <div key={index} className="space-y-2 p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-700">Token {index + 1}</h4>
                          <button
                            onClick={() => removeAllocation(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          <input
                            type="text"
                            value={allocation.symbol}
                            onChange={(e) => handleAllocationChange(index, 'symbol', e.target.value)}
                            placeholder="Token Symbol (e.g., ETH, USDC)"
                            className="input w-full"
                          />
                          <input
                            type="text"
                            value={allocation.address}
                            onChange={(e) => handleAllocationChange(index, 'address', e.target.value)}
                            placeholder="Token Contract Address (0x...)"
                            className={`input w-full ${KNOWN_ADDRESSES.includes(allocation.address) ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
                            disabled={KNOWN_ADDRESSES.includes(allocation.address)}
                          />
                          {KNOWN_ADDRESSES.includes(allocation.address) && (
                            <div className="text-xs text-gray-500">
                              {TOKEN_DESCRIPTIONS[allocation.symbol as keyof typeof TOKEN_DESCRIPTIONS]}
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={allocation.percentage}
                              onChange={(e) => handleAllocationChange(index, 'percentage', e.target.value)}
                              placeholder="Percentage"
                              className="input flex-1"
                              min="0"
                              max="100"
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={addAllocation}
                    className="btn btn-outline btn-sm mt-3"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Token
                  </button>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setStep('template')}
                    className="btn btn-outline btn-md px-6"
                  >
                    Back to Templates
                  </button>
                  <button
                    onClick={() => setStep('review')}
                    disabled={!isValid}
                    className="btn btn-primary btn-md px-6"
                  >
                    Review Strategy
                  </button>
                </div>
              </div>
            )}

            {step === 'review' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Strategy</h3>
                  
                  <div className="card p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3">{strategyName}</h4>
                    <div className="space-y-3">
                      {customAllocations.map((allocation, index) => (
                        <div key={index} className="border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900">{allocation.symbol}</span>
                                <span className="text-sm font-medium text-gray-900">{allocation.percentage}%</span>
                              </div>
                              {allocation.address && (
                                <div className="text-xs text-gray-500 mt-1 font-mono">
                                  {allocation.address.slice(0, 10)}...{allocation.address.slice(-8)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total:</span>
                        <span className={`font-medium ${totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
                          {totalPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {totalPercentage !== 100 && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-600">
                        Total allocation must equal 100%. Current total: {totalPercentage}%
                      </p>
                    </div>
                  )}

                  {!address && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-600">
                        Please connect your wallet to create a strategy.
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setStep(selectedTemplate ? 'template' : 'custom')}
                    disabled={saving}
                    className="btn btn-outline btn-md px-6"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateStrategy}
                    disabled={!isValid || !address || saving}
                    className="btn btn-primary btn-md px-6"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Create Strategy
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 