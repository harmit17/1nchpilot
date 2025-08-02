import React from 'react';
import { useNetwork, useAccount } from 'wagmi';

export default function NetworkStatus() {
  const { chain } = useNetwork();
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
        <p className="font-bold">Not Connected</p>
        <p className="text-sm">Please connect your wallet</p>
      </div>
    );
  }

  const isAnvilFork = chain?.id === 31337;

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-3 rounded shadow-lg border ${
      isAnvilFork 
        ? 'bg-green-100 border-green-400 text-green-700' 
        : 'bg-yellow-100 border-yellow-400 text-yellow-700'
    }`}>
      <p className="font-bold">
        {isAnvilFork ? '🔗 Connected to Anvil Fork' : '🌐 Connected to ' + chain?.name}
      </p>
      <p className="text-sm">
        Chain ID: {chain?.id} | {address?.slice(0, 6)}...{address?.slice(-4)}
      </p>
      {isAnvilFork && (
        <p className="text-xs mt-1">✅ Using forked mainnet data</p>
      )}
    </div>
  );
}
