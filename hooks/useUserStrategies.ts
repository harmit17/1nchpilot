import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Strategy } from '@/types';

export function useUserStrategies() {
  const { address } = useAccount();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user strategies
  const fetchStrategies = async () => {
    if (!address) {
      setStrategies([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/strategies?walletAddress=${address}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch strategies');
      }

      setStrategies(result.data || []);
    } catch (err: any) {
      console.error('Error fetching strategies:', err);
      setError(err.message || 'Failed to fetch strategies');
      setStrategies([]);
    } finally {
      setLoading(false);
    }
  };

  // Create a new strategy
  const createStrategy = async (strategyData: {
    name: string;
    description?: string;
    targetAllocation: any[];
    driftThreshold?: number;
    autoRebalance?: boolean;
    chainId?: number;
  }) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    const response = await fetch('/api/strategies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: address,
        ...strategyData,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to create strategy');
    }

    // Refresh the strategies list
    await fetchStrategies();

    return result.data;
  };

  // Delete a strategy
  const deleteStrategy = async (strategyId: string) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    const response = await fetch(`/api/strategies/delete/${strategyId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: address,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete strategy');
    }

    // Refresh the strategies list
    await fetchStrategies();

    return result.data;
  };

  // Fetch strategies when wallet address changes
  useEffect(() => {
    fetchStrategies();
  }, [address]);

  return {
    strategies,
    loading,
    error,
    fetchStrategies,
    createStrategy,
    deleteStrategy,
    hasStrategies: strategies.length > 0,
  };
}
