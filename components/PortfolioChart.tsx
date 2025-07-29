'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Portfolio } from '@/types';
import { generateChartColors, formatCurrency, formatPercentage } from '@/utils';

interface PortfolioChartProps {
  portfolio: Portfolio;
}

export default function PortfolioChart({ portfolio }: PortfolioChartProps) {
  const chartData = portfolio.tokens.map((token, index) => ({
    name: token.token.symbol,
    value: token.balanceUSD,
    percentage: token.percentage,
    color: generateChartColors(portfolio.tokens.length)[index],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Value: {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-gray-600">
            Allocation: {formatPercentage(data.percentage)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => (
    <div className="flex flex-wrap gap-2 mt-4">
      {payload?.map((entry: any, index: number) => (
        <div key={entry.value} className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-600">
            {entry.value} ({formatPercentage(chartData[index]?.percentage || 0)})
          </span>
        </div>
      ))}
    </div>
  );

  if (portfolio.tokens.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No tokens to display</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
} 