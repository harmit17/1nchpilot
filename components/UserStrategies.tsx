import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { Settings, Target, TrendingUp, Calendar, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { Strategy } from '@/types';
import { useUserStrategies } from '@/hooks/useUserStrategies';

interface UserStrategiesProps {
  onSelectStrategy?: (strategy: Strategy) => void;
}

export default function UserStrategies({ onSelectStrategy }: UserStrategiesProps) {
  const { address } = useAccount();
  const { strategies, loading, error, deleteStrategy } = useUserStrategies();
  const [deletingStrategy, setDeletingStrategy] = useState<string | null>(null);

  const handleDeleteStrategy = async (strategyId: string, strategyName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    
    if (!confirm(`Are you sure you want to delete "${strategyName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingStrategy(strategyId);

    try {
      await deleteStrategy(strategyId);
    } catch (err: any) {
      console.error('Error deleting strategy:', err);
      alert(err.message || 'Failed to delete strategy');
    } finally {
      setDeletingStrategy(null);
    }
  };

  if (!address) {
    return (
      <div className="text-center py-8">
        <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Connect your wallet to view your strategies</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
        <p className="text-gray-600">Loading your strategies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 btn btn-outline btn-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <div className="text-center py-8">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">No strategies created yet</p>
        <p className="text-sm text-gray-500">Create your first strategy to get started</p>
      </div>
    );
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Your Strategies</h3>
        <span className="text-sm text-gray-500">{strategies.length} strategies</span>
      </div>

      <div className="space-y-3">
        {strategies.map((strategy, index) => (
          <motion.div
            key={strategy.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="relative card p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            {/* Delete Button */}
            <button
              onClick={(e) => handleDeleteStrategy(strategy.id, strategy.name, e)}
              disabled={deletingStrategy === strategy.id}
              className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50 z-10"
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
              onClick={() => onSelectStrategy?.(strategy)}
              className="pr-8" // Add padding to avoid overlap with delete button
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{strategy.name}</h4>
                      <p className="text-sm text-gray-600">{strategy.description}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Settings className="w-4 h-4" />
                      <span>{strategy.targetAllocation.length} tokens</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Created {formatDate(strategy.createdAt)}</span>
                    </div>
                    {strategy.isActive && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-600">Active</span>
                      </div>
                    )}
                  </div>

                  {/* Token allocation preview */}
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {strategy.targetAllocation.slice(0, 4).map((allocation, idx) => (
                        <div key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {allocation.token.symbol} {allocation.targetPercentage}%
                        </div>
                      ))}
                      {strategy.targetAllocation.length > 4 && (
                        <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                          +{strategy.targetAllocation.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
