'use client';

import { TokenBalance } from '@/types';
import { formatTokenAmount, formatCurrency, formatPercentage, getTokenLogoUrl } from '@/utils';
import Image from 'next/image';
import { useState } from 'react';

interface TokenListProps {
  tokens: TokenBalance[];
}

// Component for token logo with fallback
function TokenLogo({ token, size = 32 }: { token: any; size?: number }) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);

  // Get all possible logo sources
  const getLogoSources = (token: any): string[] => {
    const sources: string[] = [];
    
    // 1. Primary: Use token's original logoURI if available
    if (token.logoURI && token.logoURI.startsWith('http')) {
      sources.push(token.logoURI);
    }
    
    // Only proceed with address-based fallbacks if we have a valid address
    if (token.address && token.address.startsWith('0x') && token.address.length === 42) {
      const checksumAddress = token.address;
      
      sources.push(
        `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${checksumAddress}/logo.png`,
        `https://assets.coingecko.com/coins/images/ethereum/${token.address.toLowerCase()}.png`,
        `https://tokens.1inch.io/${checksumAddress}.png`,
        `https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/${checksumAddress}/logo.png`,
        `https://cdn.moralis.io/eth/${checksumAddress.toLowerCase()}.png`
      );
    }
    
    return sources;
  };

  const logoSources = getLogoSources(token);

  const handleError = () => {
    // Try next source if available
    if (currentSrcIndex < logoSources.length - 1) {
      setCurrentSrcIndex(currentSrcIndex + 1);
      setIsLoading(true);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // If all sources failed or no sources available, show fallback
  if (hasError || logoSources.length === 0) {
    return (
      <div 
        className="rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold"
        style={{ width: size, height: size, fontSize: Math.max(size * 0.3, 10) }}
      >
        {token.symbol.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Image
        src={logoSources[currentSrcIndex]}
        alt={token.symbol}
        width={size}
        height={size}
        className="rounded-full object-cover"
        onError={handleError}
        onLoad={handleLoad}
        style={{ 
          display: hasError ? 'none' : 'block',
          width: size,
          height: size 
        }}
      />
      {isLoading && !hasError && (
        <div 
          className="absolute inset-0 rounded-full bg-gray-200 animate-pulse"
          style={{ width: size, height: size }}
        />
      )}
    </div>
  );
}

interface TokenListProps {
  tokens: TokenBalance[];
}

export default function TokenList({ tokens }: TokenListProps) {
  if (tokens.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No tokens found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tokens.map((token, index) => (
        <div
          key={token.token.address}
          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <TokenLogo token={token.token} size={32} />
            <div>
              <p className="font-semibold text-gray-900">{token.token.symbol}</p>
              <p className="text-sm text-gray-500">{token.token.name}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="font-semibold text-gray-900">
              {formatTokenAmount(token.balance, token.token.decimals, token.token.symbol)}
            </p>
            <p className="text-sm text-gray-500">
              {formatCurrency(token.balanceUSD)}
            </p>
            <p className="text-xs text-gray-400">
              {formatPercentage(token.percentage)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
} 