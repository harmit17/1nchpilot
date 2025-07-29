'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { Portfolio } from '@/types';
import { formatCurrency, formatPercentage } from '@/utils';

interface PortfolioOverviewProps {
  portfolio: Portfolio;
}

export default function PortfolioOverview({ portfolio }: PortfolioOverviewProps) {
  const stats = [
    {
      label: 'Total Value',
      value: formatCurrency(portfolio.totalValueUSD),
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Token Count',
      value: portfolio.tokens.length.toString(),
      icon: PieChart,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Largest Position',
      value: portfolio.tokens.length > 0 
        ? `${portfolio.tokens[0].token.symbol} (${formatPercentage(portfolio.tokens[0].percentage)})`
        : 'N/A',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Last Updated',
      value: portfolio.lastUpdated.toLocaleTimeString(),
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Portfolio Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex items-center space-x-4"
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bgColor}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Portfolio Summary */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Total Tokens:</span>
            <span className="font-semibold text-gray-900">{portfolio.tokens.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Total Value:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(portfolio.totalValueUSD)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Last Updated:</span>
            <span className="font-semibold text-gray-900">
              {portfolio.lastUpdated.toLocaleDateString()} {portfolio.lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 