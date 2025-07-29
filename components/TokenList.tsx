'use client';

import { TokenBalance } from '@/types';
import { formatTokenAmount, formatCurrency, formatPercentage, getTokenLogoUrl } from '@/utils';
import Image from 'next/image';

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
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
              {token.token.logoURI ? (
                <Image
                  src={getTokenLogoUrl(token.token)}
                  alt={token.token.symbol}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {token.token.symbol.charAt(0)}
                  </span>
                </div>
              )}
            </div>
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