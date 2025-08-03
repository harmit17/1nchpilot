'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, CheckCircle, Settings } from 'lucide-react';
import { Strategy, DEFAULT_STRATEGY_TEMPLATES } from '@/types';

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
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customAllocations, setCustomAllocations] = useState<Array<{ symbol: string; address: string; percentage: number }>>([]);
  const [strategyName, setStrategyName] = useState('');
  const [step, setStep] = useState<'template' | 'custom' | 'review'>('template');

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

  const handleCreateStrategy = () => {
    const strategy: Strategy = {
      id: Date.now().toString(),
      name: strategyName,
      description: selectedTemplate ? 
        DEFAULT_STRATEGY_TEMPLATES.find(t => t.id === selectedTemplate)?.description : 
        'Custom portfolio strategy',
      targetAllocation: customAllocations.map(allocation => ({
        token: {
          address: allocation.address || '', // Use provided address or empty string
          symbol: allocation.symbol,
          name: allocation.symbol,
          decimals: 18,
          chainId: 1,
        },
        targetPercentage: allocation.percentage,
      })),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'user-id', // Will be set from auth
      driftThreshold: 5,
      autoRebalance: false,
    };

    onStrategyCreated(strategy);
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
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose a Template</h3>
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
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setStep(selectedTemplate ? 'template' : 'custom')}
                    className="btn btn-outline btn-md px-6"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateStrategy}
                    disabled={!isValid}
                    className="btn btn-primary btn-md px-6"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Create Strategy
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