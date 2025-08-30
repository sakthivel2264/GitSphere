'use client';

import { LanguageStats } from '@/lib/types';
import { getLanguageColor } from '@/lib/utils';
import Card from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface LanguageChartProps {
  languageStats: LanguageStats;
}

export default function LanguageChart({ languageStats }: LanguageChartProps) {
  const data = Object.entries(languageStats.languages)
    .map(([name, value]) => ({
      name,
      value,
      color: getLanguageColor(name),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Top 8 languages

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Programming Languages
      </h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [value, 'Repositories']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Primary Language:</span>
          <span className="font-semibold text-gray-900">
            {languageStats.primary_language || 'N/A'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Diversity Score:</span>
          <span className="font-semibold text-gray-900">
            {(languageStats.language_diversity_score * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </Card>
  );
}
